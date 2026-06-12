import type {
  ActionDescriptor,
  ActionInvocation,
  ActionState,
} from "@ptl/action-core";
import type { ActionRunner } from "./action-runner";

export interface ActionContextMenuItem {
  action: ActionDescriptor;
  state: ActionState;
}

/**
 * Lists context-menu actions and their current state.
 */
export function createActionContextMenuItems(
  runner: ActionRunner,
  invocation: ActionInvocation,
  actions: readonly ActionDescriptor[] = runner.list(),
): ActionContextMenuItem[] {
  return actions
    .filter((action) =>
      action.presentation?.contextMenu !== undefined ||
      action.presentation?.menu !== undefined,
    )
    .map((action) => ({
      action,
      state: runner.getState?.(action.id) ?? { visible: true, enabled: true },
    }))
    .filter(
      (item) =>
        item.state.visible && canAppearForContextMenu(item.action, invocation),
    );
}

function canAppearForContextMenu(
  action: ActionDescriptor,
  invocation: ActionInvocation,
): boolean {
  return (
    action.triggerFocus?.[invocation.source] !== "required" ||
    invocation.target !== undefined ||
    invocation.surfaceId !== undefined
  );
}
