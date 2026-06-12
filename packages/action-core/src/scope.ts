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
  ActionScopeElement,
  ActionScopeRequirement,
  ActionState,
} from "./types";

export type ActionContextProvider<TContext extends ActionContext> =
  () => TContext;

export interface ActionScopeOptions<TContext extends ActionContext> {
  id: string;
  registry?: ActionRegistry<TContext>;
  getContext: ActionContextProvider<TContext>;
  actions?: Iterable<ActionDefinition<TContext>>;
  elements?: Iterable<ActionScopeElement>;
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
 * Scope elements represent focusable or addressable surfaces such as editor
 * panes. Trigger adapters can pass `scopeElementId` or `target` in invocation;
 * actions may require scope for specific triggers via `triggerScopes`.
 */
export class ActionScope<TContext extends ActionContext = ActionContext>
  implements ActionScopeBridge
{
  readonly id: string;
  readonly registry: ActionRegistry<TContext>;
  private readonly elements = new Map<string, ActionScopeElement>();
  private readonly getContextValue: ActionContextProvider<TContext>;

  constructor(options: ActionScopeOptions<TContext>) {
    this.id = options.id;
    this.registry = options.registry ?? new ActionRegistry<TContext>();
    this.getContextValue = options.getContext;

    if (options.actions) {
      this.registry.registerMany(options.actions);
    }

    if (options.elements) {
      for (const element of options.elements) this.registerElement(element);
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

  registerElement(element: ActionScopeElement): () => void {
    if (this.elements.has(element.id)) {
      throw new Error(`Action scope element "${element.id}" is already registered.`);
    }

    this.elements.set(element.id, element);
    return () => {
      if (this.elements.get(element.id) === element) {
        this.elements.delete(element.id);
      }
    };
  }

  getElement(id: string): ActionScopeElement | undefined {
    return this.elements.get(id);
  }

  resolveElement(invocation: ActionInvocation): ActionScopeElement | undefined {
    if (invocation.scopeElementId) {
      const element = this.elements.get(invocation.scopeElementId);
      if (element && this.isElementActive(element)) return element;
    }

    if (invocation.target !== undefined) {
      for (const element of this.elements.values()) {
        if (!this.isElementActive(element)) continue;
        if (element.containsTarget?.(invocation.target)) return element;
      }
    }

    for (const element of this.elements.values()) {
      if (this.isElementActive(element)) return element;
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
    const scopeState = this.getInvocationScopeState(action, normalizedInvocation);
    if (!scopeState.ok) return Promise.resolve(scopeState.result);

    return this.registry.run(id, this.getContext(), normalizedInvocation);
  }

  runAction<TResult, TPayload>(
    action: ActionDefinition<TContext, TResult, TPayload>,
    invocation: ActionInvocationInput<TPayload>,
  ): Promise<ActionRunResult<TResult>> {
    const scopeState = this.getInvocationScopeState(action, invocation);
    if (!scopeState.ok) return Promise.resolve(scopeState.result);

    return this.registry.runAction(action, this.getContext(), invocation);
  }

  private isElementActive(element: ActionScopeElement): boolean {
    return element.isActive?.() ?? true;
  }

  private getInvocationScopeState(
    action: ActionDescriptor,
    invocation: ActionInvocation,
  ):
    | { ok: true }
    | { ok: false; result: ActionRunResult<never> } {
    const requirement: ActionScopeRequirement =
      action.triggerScopes?.[invocation.source] ?? "optional";

    if (requirement !== "required") return { ok: true };

    const element = this.resolveElement(invocation);
    if (element) return { ok: true };

    return {
      ok: false,
      result: {
        ok: false,
        actionId: action.id,
        reason: "scope-unavailable",
        message: `Action "${action.id}" requires an active scope element for "${invocation.source}".`,
      },
    };
  }
}

export function createActionScope<TContext extends ActionContext>(
  options: ActionScopeOptions<TContext>,
): ActionScope<TContext> {
  return new ActionScope(options);
}
