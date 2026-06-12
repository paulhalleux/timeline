import { ActionScope } from "./scope";
import type {
  ActionContext,
  ActionDefinition,
  ActionInvocation,
  ActionInvocationInput,
  ActionListOptions,
  ActionPayload,
  ActionRegisterOptions,
  ActionResult,
  ActionRunResult,
  ActionSurface,
  ActionState,
} from "./types";

export type ActionDefinitions<TContext extends ActionContext> = Record<
  string,
  ActionDefinition<TContext, unknown, unknown>
>;

export interface TypedActionRegistryOptions<
  TContext extends ActionContext,
  TActions extends ActionDefinitions<TContext>,
> {
  id?: string;
  getContext: () => TContext;
  actions: TActions;
  surfaces?: Iterable<ActionSurface>;
}

/**
 * Type-safe registry facade for a fixed action map.
 *
 * Use this when callers know the action map at compile time and should get
 * autocomplete for action keys plus payload/result inference for invocation.
 */
export class TypedActionRegistry<
  TContext extends ActionContext,
  TActions extends ActionDefinitions<TContext>,
> {
  readonly actions: TActions;
  readonly scope: ActionScope<TContext>;

  constructor(options: TypedActionRegistryOptions<TContext, TActions>) {
    this.actions = options.actions;
    this.scope = new ActionScope({
      id: options.id ?? "typed",
      getContext: options.getContext,
      actions: Object.values(options.actions),
      surfaces: options.surfaces,
    });
  }

  getContext(): TContext {
    return this.scope.getContext();
  }

  register<TKey extends string, TAction extends ActionDefinition<TContext>>(
    _key: TKey,
    action: TAction,
    options?: ActionRegisterOptions,
  ): () => void {
    return this.scope.register(action, options);
  }

  registerSurface(surface: ActionSurface): () => void {
    return this.scope.registerSurface(surface);
  }

  list(options: Omit<ActionListOptions<TContext>, "context"> = {}) {
    return this.scope.list(options);
  }

  getState<TKey extends keyof TActions>(key: TKey): ActionState {
    return this.scope.registry.getActionState(
      this.actions[key],
      this.scope.getContext(),
    );
  }

  run<TKey extends keyof TActions>(
    key: TKey,
    invocation: ActionInvocationInput<ActionPayload<TActions[TKey]>>,
  ): Promise<ActionRunResult<ActionResult<TActions[TKey]>>>;
  run(
    key: keyof TActions,
    invocation: ActionInvocation,
  ): Promise<ActionRunResult> {
    return this.runUnknown(this.actions[key], invocation);
  }

  private runUnknown(
    action: ActionDefinition<TContext>,
    invocation: ActionInvocation,
  ): Promise<ActionRunResult> {
    return this.scope.run(action.id, invocation);
  }
}

export function createTypedActionRegistry<
  TContext extends ActionContext,
  TActions extends ActionDefinitions<TContext>,
>(
  options: TypedActionRegistryOptions<TContext, TActions>,
): TypedActionRegistry<TContext, TActions> {
  return new TypedActionRegistry(options);
}
