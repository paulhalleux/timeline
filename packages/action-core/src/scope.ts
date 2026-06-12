import { ActionRegistry } from "./registry";
import type {
  ActionContext,
  ActionDefinition,
  ActionId,
  ActionInvocation,
  ActionListOptions,
  ActionRegisterOptions,
  ActionRunResult,
  ActionState,
} from "./types";

export type ActionContextProvider<TContext extends ActionContext> =
  () => TContext;

export interface ActionScopeOptions<TContext extends ActionContext> {
  id: string;
  registry?: ActionRegistry<TContext>;
  getContext: ActionContextProvider<TContext>;
  actions?: Iterable<ActionDefinition<TContext>>;
}

/**
 * Typed action scope that binds a registry to the context needed by its actions.
 *
 * Use scopes when an application has multiple action contexts, for example a
 * global shell context, a timeline context, and a timed-text editor context.
 */
export class ActionScope<TContext extends ActionContext = ActionContext> {
  readonly id: string;
  readonly registry: ActionRegistry<TContext>;
  private readonly getContextValue: ActionContextProvider<TContext>;

  constructor(options: ActionScopeOptions<TContext>) {
    this.id = options.id;
    this.registry = options.registry ?? new ActionRegistry<TContext>();
    this.getContextValue = options.getContext;

    if (options.actions) {
      this.registry.registerMany(options.actions);
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

  list(options: Omit<ActionListOptions<TContext>, "context"> = {}) {
    return this.registry.list({ ...options, context: this.getContext() });
  }

  getState(id: ActionId): ActionState {
    return this.registry.getState(id, this.getContext());
  }

  run<TResult = unknown, TPayload = unknown>(
    id: ActionId,
    invocation?: ActionInvocation<TPayload>,
  ): Promise<ActionRunResult<TResult>> {
    return this.registry.run<TResult, TPayload>(
      id,
      this.getContext(),
      invocation,
    );
  }
}

export function createActionScope<TContext extends ActionContext>(
  options: ActionScopeOptions<TContext>,
): ActionScope<TContext> {
  return new ActionScope(options);
}
