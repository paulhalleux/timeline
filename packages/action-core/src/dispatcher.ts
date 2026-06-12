import type { ActionScopeBridge } from "./scope";
import type {
  ActionDescriptor,
  ActionId,
  ActionInvocation,
  ActionRunResult,
  ActionState,
} from "./types";

export interface ActionDispatchMatch {
  scope: ActionScopeBridge;
  action: ActionDescriptor;
}

/**
 * Runtime dispatcher for applications that compose multiple typed action scopes.
 *
 * Direct scope usage preserves exact context typing. The dispatcher provides the
 * dynamic cross-scope path used by command palettes and global shortcut adapters
 * where the action id is only known at runtime.
 */
export class ActionDispatcher {
  private readonly scopes = new Map<string, ActionScopeBridge>();

  registerScope(scope: ActionScopeBridge): () => void {
    if (this.scopes.has(scope.id)) {
      throw new Error(`Action scope "${scope.id}" is already registered.`);
    }

    this.scopes.set(scope.id, scope);
    return () => {
      if (this.scopes.get(scope.id) === scope) {
        this.scopes.delete(scope.id);
      }
    };
  }

  unregisterScope(scopeId: string): boolean {
    return this.scopes.delete(scopeId);
  }

  getScope(scopeId: string): ActionScopeBridge | undefined {
    return this.scopes.get(scopeId);
  }

  list(): ActionDescriptor[] {
    return Array.from(this.scopes.values(), (scope) => scope.list()).flat();
  }

  find(id: ActionId): ActionDispatchMatch | undefined {
    for (const scope of this.scopes.values()) {
      const action = scope.get(id);
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

  async run(
    id: ActionId,
    invocation?: ActionInvocation,
  ): Promise<ActionRunResult> {
    const match = this.find(id);
    if (!match) {
      return {
        ok: false,
        actionId: id,
        reason: "not-found",
        message: `Action "${id}" is not registered.`,
      };
    }

    return match.scope.run(id, invocation);
  }
}
