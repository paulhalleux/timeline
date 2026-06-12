import type {
  ActionContext,
  ActionDefinition,
  ActionGuardResult,
  ActionId,
  ActionInvocation,
  ActionInvocationInput,
  ActionListOptions,
  ActionRegisterOptions,
  ActionRunResult,
  ActionState,
} from "./types";

function normalizeGuardResult(
  value: boolean | ActionGuardResult | undefined,
): ActionGuardResult {
  if (typeof value === "undefined") return { ok: true };
  if (typeof value === "boolean") return { ok: value };
  return value;
}

function compareActions<TContext extends ActionContext>(
  a: ActionDefinition<TContext>,
  b: ActionDefinition<TContext>,
): number {
  const order = (a.order ?? 0) - (b.order ?? 0);
  if (order !== 0) return order;

  const category = a.category.localeCompare(b.category);
  if (category !== 0) return category;

  return a.title.localeCompare(b.title);
}

/**
 * Framework-agnostic registry for user-triggerable actions.
 *
 * The registry knows how to store, query, and run actions. It does not know how
 * to render menus or bind shortcuts; adapters consume the metadata exposed by
 * registered actions.
 */
export class ActionRegistry<TContext extends ActionContext = ActionContext> {
  private readonly actions = new Map<ActionId, ActionDefinition<TContext>>();

  /**
   * Register an action and return an unregister callback.
   */
  register(
    action: ActionDefinition<TContext>,
    options: ActionRegisterOptions = {},
  ): () => void {
    const onDuplicate = options.onDuplicate ?? "throw";
    const existing = this.actions.get(action.id);

    if (existing) {
      if (onDuplicate === "throw") {
        throw new Error(`Action with id "${action.id}" is already registered.`);
      }
      if (onDuplicate === "ignore") {
        return () => undefined;
      }
    }

    this.actions.set(action.id, action);

    return () => {
      if (this.actions.get(action.id) === action) {
        this.actions.delete(action.id);
      }
    };
  }

  /**
   * Register many actions and return one callback that unregisters all of them.
   */
  registerMany(
    actions: Iterable<ActionDefinition<TContext>>,
    options: ActionRegisterOptions = {},
  ): () => void {
    const unregister = Array.from(actions, (action) =>
      this.register(action, options),
    );

    return () => {
      for (const dispose of [...unregister].reverse()) dispose();
    };
  }

  unregister(id: ActionId): boolean {
    return this.actions.delete(id);
  }

  clear(): void {
    this.actions.clear();
  }

  has(id: ActionId): boolean {
    return this.actions.has(id);
  }

  get(id: ActionId): ActionDefinition<TContext> | undefined {
    return this.actions.get(id);
  }

  list(options: ActionListOptions<TContext> = {}): ActionDefinition<TContext>[] {
    const result: ActionDefinition<TContext>[] = [];

    for (const action of this.actions.values()) {
      if (options.category && action.category !== options.category) continue;

      if (options.context) {
        const state = this.getState(action.id, options.context);
        if (!options.includeHidden && !state.visible) continue;
        if (!options.includeDisabled && !state.enabled) continue;
      }

      result.push(action);
    }

    return result.sort(compareActions);
  }

  getState(id: ActionId, context: TContext): ActionState {
    const action = this.actions.get(id);
    if (!action) {
      return {
        visible: false,
        enabled: false,
        hiddenReason: `Action "${id}" is not registered.`,
        disabledReason: `Action "${id}" is not registered.`,
      };
    }

    return this.getActionState(action, context);
  }

  getActionState(
    action: ActionDefinition<TContext>,
    context: TContext,
  ): ActionState {
    const visible = normalizeGuardResult(action.visibleWhen?.(context));
    if (!visible.ok) {
      return {
        visible: false,
        enabled: false,
        hiddenReason: visible.reason,
        disabledReason: visible.reason,
      };
    }

    const enabled = normalizeGuardResult(action.enabledWhen?.(context));
    return {
      visible: true,
      enabled: enabled.ok,
      disabledReason: enabled.reason,
    };
  }

  async run(
    id: ActionId,
    context: TContext,
    invocation: ActionInvocation = { source: "api" },
  ): Promise<ActionRunResult> {
    const action = this.actions.get(id);

    if (!action) {
      return {
        ok: false,
        actionId: id,
        reason: "not-found",
        message: `Action "${id}" is not registered.`,
      };
    }

    return this.runRegisteredAction(action, context, invocation);
  }

  private async runRegisteredAction(
    action: ActionDefinition<TContext>,
    context: TContext,
    invocation: ActionInvocation,
  ): Promise<ActionRunResult> {
    const state = this.getActionState(action, context);
    if (!state.visible) {
      return {
        ok: false,
        actionId: action.id,
        reason: "hidden",
        message: state.hiddenReason ?? `Action "${action.id}" is hidden.`,
      };
    }
    if (!state.enabled) {
      return {
        ok: false,
        actionId: action.id,
        reason: "disabled",
        message: state.disabledReason ?? `Action "${action.id}" is disabled.`,
      };
    }

    try {
      const value = await action.run(context, invocation);
      return { ok: true, actionId: action.id, value };
    } catch (error) {
      return {
        ok: false,
        actionId: action.id,
        reason: "failed",
        message:
          error instanceof Error
            ? error.message
            : `Action "${action.id}" failed during execution.`,
        error,
      };
    }
  }

  async runAction<TResult, TPayload>(
    action: ActionDefinition<TContext, TResult, TPayload>,
    context: TContext,
    invocation: ActionInvocationInput<TPayload>,
  ): Promise<ActionRunResult<TResult>> {
    const state = this.getActionState(action, context);
    if (!state.visible) {
      return {
        ok: false,
        actionId: action.id,
        reason: "hidden",
        message: state.hiddenReason ?? `Action "${action.id}" is hidden.`,
      };
    }
    if (!state.enabled) {
      return {
        ok: false,
        actionId: action.id,
        reason: "disabled",
        message: state.disabledReason ?? `Action "${action.id}" is disabled.`,
      };
    }

    try {
      const value = await action.run(context, invocation);
      return { ok: true, actionId: action.id, value };
    } catch (error) {
      return {
        ok: false,
        actionId: action.id,
        reason: "failed",
        message:
          error instanceof Error
            ? error.message
            : `Action "${action.id}" failed during execution.`,
        error,
      };
    }
  }
}
