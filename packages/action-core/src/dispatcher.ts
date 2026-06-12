import type { ActionScope } from "./scope";
import type {
  ActionContext,
  ActionDefinition,
  ActionId,
  ActionInvocation,
  ActionRunResult,
  ActionState,
} from "./types";

export interface ActionDispatchMatch<TContext extends ActionContext> {
  scope: ActionScope<TContext>;
  action: ActionDefinition<TContext>;
}

/**
 * Runtime dispatcher for applications that compose multiple typed action scopes.
 *
 * Direct scope usage preserves exact context typing. The dispatcher provides the
 * dynamic cross-scope path used by command palettes and global shortcut adapters
 * where the action id is only known at runtime.
 */
export class ActionDispatcher {
  private readonly scopes = new Map<string, ActionScope<ActionContext>>();

  registerScope<TContext extends ActionContext>(
    scope: ActionScope<TContext>,
  ): () => void {
    if (this.scopes.has(scope.id)) {
      throw new Error(`Action scope "${scope.id}" is already registered.`);
    }

    const erasedScope = scope as unknown as ActionScope<ActionContext>;
    this.scopes.set(scope.id, erasedScope);
    return () => {
      if (this.scopes.get(scope.id) === erasedScope) {
        this.scopes.delete(scope.id);
      }
    };
  }

  unregisterScope(scopeId: string): boolean {
    return this.scopes.delete(scopeId);
  }

  getScope<TContext extends ActionContext>(
    scopeId: string,
  ): ActionScope<TContext> | undefined {
    return this.scopes.get(scopeId) as ActionScope<TContext> | undefined;
  }

  list(): ActionDefinition<ActionContext>[] {
    return Array.from(this.scopes.values(), (scope) => scope.list()).flat();
  }

  find(id: ActionId): ActionDispatchMatch<ActionContext> | undefined {
    for (const scope of this.scopes.values()) {
      const action = scope.registry.get(id);
      if (action) return { scope, action };
    }

    return undefined;
  }

  getState(id: ActionId): ActionState {
    const match = this.find(id);
    if (!match) {
      return {
        visible: false,
        enabled: false,
        hiddenReason: `Action "${id}" is not registered.`,
        disabledReason: `Action "${id}" is not registered.`,
      };
    }

    return match.scope.getState(id);
  }

  async run<TResult = unknown, TPayload = unknown>(
    id: ActionId,
    invocation?: ActionInvocation<TPayload>,
  ): Promise<ActionRunResult<TResult>> {
    const match = this.find(id);
    if (!match) {
      return {
        ok: false,
        actionId: id,
        reason: "not-found",
        message: `Action "${id}" is not registered.`,
      };
    }

    return match.scope.run<TResult, TPayload>(id, invocation);
  }
}
