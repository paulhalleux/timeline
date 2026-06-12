import type { ActionContext, ActionDefinition, ActionId } from "./definition";
import type { ActionRegistry } from "./registry";
import { enabledActionState } from "./state";

/**
 * Error reported when an action cannot be executed.
 *
 * @example
 * ```ts
 * const error: ActionExecutionError = {
 *   code: "action.disabled",
 *   message: "Action is disabled.",
 *   actionId: "editor.file.save",
 * };
 * ```
 */
export interface ActionExecutionError {
  code: string;
  message: string;
  actionId: ActionId;
}

/**
 * Result returned after attempting to execute an action.
 *
 * @example
 * ```ts
 * const result = await executeAction(registry, "editor.file.save", context);
 * if (!result.ok) console.error(result.error.message);
 * ```
 */
export type ActionExecutionResult =
  | {
      ok: true;
      actionId: ActionId;
    }
  | {
      ok: false;
      actionId: ActionId;
      error: ActionExecutionError;
    };

/**
 * Execute an action definition after checking visibility and enabled state.
 *
 * @param action - Action definition to execute.
 * @param context - Runtime services and trigger source.
 * @returns Rich result describing whether the action ran.
 *
 * @example
 * ```ts
 * await runAction(saveAction, {
 *   source: "shortcut",
 *   services: { save: async () => undefined },
 * });
 * ```
 */
export async function runAction<TContext>(
  action: ActionDefinition<TContext>,
  context: ActionContext<TContext>,
): Promise<ActionExecutionResult> {
  const state = action.getState?.(context) ?? enabledActionState();

  if (!state.visible) {
    return actionExecutionFailure(
      action.descriptor.id,
      "action.hidden",
      state.reason ?? "Action is hidden.",
    );
  }

  if (!state.enabled) {
    return actionExecutionFailure(
      action.descriptor.id,
      "action.disabled",
      state.reason ?? "Action is disabled.",
    );
  }

  await action.run(context);

  return {
    ok: true,
    actionId: action.descriptor.id,
  };
}

/**
 * Resolve and execute an action from a registry.
 *
 * @param registry - Registry that owns action definitions.
 * @param actionId - Id of the action to execute.
 * @param context - Runtime services and trigger source.
 * @returns Rich result describing whether the action ran.
 *
 * @example
 * ```ts
 * const result = await executeAction(registry, "editor.file.save", {
 *   source: "menubar",
 *   services,
 * });
 * ```
 */
export async function executeAction<TContext>(
  registry: ActionRegistry<TContext>,
  actionId: ActionId,
  context: ActionContext<TContext>,
): Promise<ActionExecutionResult> {
  const action = registry.get(actionId);

  if (!action)
    return actionExecutionFailure(actionId, "action.not-found", "Action is not registered.");

  return runAction(action, context);
}

function actionExecutionFailure(
  actionId: ActionId,
  code: string,
  message: string,
): ActionExecutionResult {
  return {
    ok: false,
    actionId,
    error: {
      code,
      message,
      actionId,
    },
  };
}
