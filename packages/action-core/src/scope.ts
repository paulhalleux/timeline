import { ActionRegistry } from "./registry";
import type {
  ActionContext,
  ActionDefinition,
  ActionDescriptor,
  ActionId,
  ActionInvocation,
  ActionInvocationInput,
  ActionListOptions,
  ActionRegisterOptions,
  ActionRunResult,
  ActionSurface,
  ActionFocusRequirement,
  ActionState,
} from "./types";

export type ActionContextProvider<TContext extends ActionContext> =
  () => TContext;

export interface ActionScopeOptions<TContext extends ActionContext> {
  id: string;
  registry?: ActionRegistry<TContext>;
  getContext: ActionContextProvider<TContext>;
  actions?: Iterable<ActionDefinition<TContext>>;
  surfaces?: Iterable<ActionSurface>;
}

/**
 * Public, context-erased shape consumed by dynamic dispatchers.
 */
export interface ActionScopeBridge {
  readonly id: string;
  list(): ActionDescriptor[];
  get(id: ActionId): ActionDescriptor | undefined;
  getState(id: ActionId): ActionState;
  run(id: ActionId, invocation?: ActionInvocation): Promise<ActionRunResult>;
}

/**
 * Typed action scope that binds a registry to the context needed by its actions.
 *
 * ActionScope is the logical/business boundary: a registry plus the context
 * required by its actions. UI focus is represented separately by ActionSurface.
 * Trigger adapters can pass `surfaceId` or `target` in invocation; actions may
 * require an active surface for specific triggers via `triggerFocus`.
 */
export class ActionScope<TContext extends ActionContext = ActionContext>
  implements ActionScopeBridge
{
  readonly id: string;
  readonly registry: ActionRegistry<TContext>;
  private readonly surfaces = new Map<string, ActionSurface>();
  private readonly getContextValue: ActionContextProvider<TContext>;

  constructor(options: ActionScopeOptions<TContext>) {
    this.id = options.id;
    this.registry = options.registry ?? new ActionRegistry<TContext>();
    this.getContextValue = options.getContext;

    if (options.actions) {
      this.registry.registerMany(options.actions);
    }

    if (options.surfaces) {
      for (const surface of options.surfaces) this.registerSurface(surface);
    }
  }

  getContext(): TContext {
    return this.getContextValue();
  }

  register(
    action: ActionDefinition<TContext>,
    options?: ActionRegisterOptions,
  ): () => void {
    return this.registry.register(action, options);
  }

  registerMany(
    actions: Iterable<ActionDefinition<TContext>>,
    options?: ActionRegisterOptions,
  ): () => void {
    return this.registry.registerMany(actions, options);
  }

  registerSurface(surface: ActionSurface): () => void {
    if (this.surfaces.has(surface.id)) {
      throw new Error(`Action surface "${surface.id}" is already registered.`);
    }

    this.surfaces.set(surface.id, surface);
    return () => {
      if (this.surfaces.get(surface.id) === surface) {
        this.surfaces.delete(surface.id);
      }
    };
  }

  getSurface(id: string): ActionSurface | undefined {
    return this.surfaces.get(id);
  }

  resolveSurface(invocation: ActionInvocation): ActionSurface | undefined {
    if (invocation.surfaceId) {
      const surface = this.surfaces.get(invocation.surfaceId);
      if (surface && this.isSurfaceActive(surface)) return surface;
    }

    if (invocation.target !== undefined) {
      for (const surface of this.surfaces.values()) {
        if (!this.isSurfaceActive(surface)) continue;
        if (surface.containsTarget?.(invocation.target)) return surface;
      }
    }

    for (const surface of this.surfaces.values()) {
      if (this.isSurfaceActive(surface)) return surface;
    }

    return undefined;
  }

  get(id: ActionId): ActionDefinition<TContext> | undefined {
    return this.registry.get(id);
  }

  list(options: Omit<ActionListOptions<TContext>, "context"> = {}) {
    return this.registry.list({ ...options, context: this.getContext() });
  }

  getState(id: ActionId): ActionState {
    return this.registry.getState(id, this.getContext());
  }

  run(id: ActionId, invocation?: ActionInvocation): Promise<ActionRunResult> {
    const action = this.registry.get(id);
    if (!action) return this.registry.run(id, this.getContext(), invocation);

    const normalizedInvocation = invocation ?? { source: "api" };
    const focusState = this.getInvocationFocusState(action, normalizedInvocation);
    if (!focusState.ok) return Promise.resolve(focusState.result);

    return this.registry.run(id, this.getContext(), normalizedInvocation);
  }

  runAction<TResult, TPayload>(
    action: ActionDefinition<TContext, TResult, TPayload>,
    invocation: ActionInvocationInput<TPayload>,
  ): Promise<ActionRunResult<TResult>> {
    const focusState = this.getInvocationFocusState(action, invocation);
    if (!focusState.ok) return Promise.resolve(focusState.result);

    return this.registry.runAction(action, this.getContext(), invocation);
  }

  private isSurfaceActive(surface: ActionSurface): boolean {
    return surface.isActive?.() ?? true;
  }

  private isFocusRequirementSatisfied(
    requirement: Exclude<ActionFocusRequirement, "none" | "optional">,
    surface: ActionSurface | undefined,
  ): boolean {
    if (!surface) return false;
    if (requirement === "required") return true;
    return surface.id === requirement.surfaceId;
  }

  private getInvocationFocusState(
    action: ActionDescriptor,
    invocation: ActionInvocation,
  ):
    | { ok: true }
    | { ok: false; result: ActionRunResult<never> } {
    const requirement: ActionFocusRequirement =
      action.triggerFocus?.[invocation.source] ?? "optional";

    if (requirement === "none" || requirement === "optional") {
      return { ok: true };
    }

    const surface = this.resolveSurface(invocation);
    if (this.isFocusRequirementSatisfied(requirement, surface)) {
      return { ok: true };
    }

    return {
      ok: false,
      result: {
        ok: false,
        actionId: action.id,
        reason: "surface-unavailable",
        message: `Action "${action.id}" requires an active action surface for "${invocation.source}".`,
      },
    };
  }
}

export function createActionScope<TContext extends ActionContext>(
  options: ActionScopeOptions<TContext>,
): ActionScope<TContext> {
  return new ActionScope(options);
}
