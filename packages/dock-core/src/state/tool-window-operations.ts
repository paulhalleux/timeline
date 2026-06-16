import { PlatformError } from "@ptl/platform-core";

import { dockErrorCodes } from "../errors";
import {
  addToolWindow,
  type DockedPlacement,
  type ToolWindowState,
  type DockState,
} from "../layout-state";
import {
  createToolWindowState,
  type ToolWindowContributionRegistry,
} from "../tool-windows/tool-window-contributions";
import { removeFloatingItem } from "./floating-operations";

/**
 * Show a tool window by using existing state or a registered contribution.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to show.
 * @param registry - Optional contribution registry used for first-time creation.
 * @returns State with the tool window visible in its docked placement.
 */
export function showToolWindowState(
  state: DockState,
  toolWindowId: string,
  registry?: ToolWindowContributionRegistry,
): DockState {
  const existing = state.toolWindows[toolWindowId];
  const contribution = registry?.get(toolWindowId);
  const toolWindow = { ...(existing ?? contributionToState(toolWindowId, contribution)), hidden: false };
  const withAdded = addToolWindow(removeFloatingItem(state, toolWindowId), toolWindow);

  return activateToolWindowState(withAdded, toolWindowId);
}

/**
 * Hide a tool window after checking contribution constraints.
 *
 * Hidden tool windows are removed from docked placements and the floating layer,
 * but their previous placement is kept so they can be restored from a menu.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to hide.
 * @param registry - Optional contribution registry with hide constraints.
 * @returns State with the tool window marked as hidden.
 */
export function hideToolWindowState(
  state: DockState,
  toolWindowId: string,
  registry?: ToolWindowContributionRegistry,
): DockState {
  const toolWindow = requireToolWindow(state, toolWindowId);
  const contribution = registry?.get(toolWindowId);

  if (contribution?.constraints?.canHide === false) {
    throw new PlatformError({
      code: dockErrorCodes.toolWindowCannotHide,
      message: `Tool window "${toolWindowId}" cannot be hidden`,
      details: { toolWindowId },
    });
  }

  const placement = state.placements[toolWindow.placement];
  const itemIds = placement.itemIds.filter((id) => id !== toolWindowId);

  return {
    ...state,
    placements: {
      ...state.placements,
      [toolWindow.placement]: {
        ...placement,
        itemIds,
        activeItemId:
          placement.activeItemId === toolWindowId ? itemIds.at(-1) : placement.activeItemId,
      },
    },
    toolWindows: {
      ...state.toolWindows,
      [toolWindowId]: {
        ...toolWindow,
        hidden: true,
      },
    },
    floating: state.floating.filter((item) => item.id !== toolWindowId),
  };
}

/**
 * Move a tool window to another dock placement and optional stack index.
 *
 * Moving always docks the tool window, clears hidden state, and removes any
 * floating entry for the same id.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to move.
 * @param placement - Destination dock placement.
 * @param index - Optional zero-based index inside the destination stack.
 * @param registry - Optional contribution registry with move constraints.
 * @returns State with the tool window docked in the destination placement.
 */
export function moveToolWindowState(
  state: DockState,
  toolWindowId: string,
  placement: DockedPlacement,
  index: number | undefined,
  registry?: ToolWindowContributionRegistry,
): DockState {
  const toolWindow = requireToolWindow(state, toolWindowId);
  const contribution = registry?.get(toolWindowId);

  if (contribution?.constraints?.canMove === false) {
    throw new PlatformError({
      code: dockErrorCodes.toolWindowCannotMove,
      message: `Tool window "${toolWindowId}" cannot be moved`,
      details: { toolWindowId },
    });
  }

  if (
    contribution?.constraints?.allowedPlacements &&
    !contribution.constraints.allowedPlacements.includes(placement)
  ) {
    throw new PlatformError({
      code: dockErrorCodes.toolWindowPlacementNotAllowed,
      message: `Tool window "${toolWindowId}" cannot move to "${placement}"`,
      details: { toolWindowId, placement },
    });
  }

  const sourcePlacement = state.placements[toolWindow.placement];
  const sourceItemIds = sourcePlacement.itemIds.filter((id) => id !== toolWindowId);

  const nextState: DockState = {
    ...state,
    floating: state.floating.filter((item) => item.id !== toolWindowId),
    placements: {
      ...state.placements,
      [toolWindow.placement]: {
        ...sourcePlacement,
        itemIds: sourceItemIds,
        // Clear activeItemId when the moved item was active so the source placement collapses.
        activeItemId:
          sourcePlacement.activeItemId === toolWindowId
            ? sourceItemIds.at(-1)
            : sourcePlacement.activeItemId,
      },
    },
    toolWindows: {
      ...state.toolWindows,
      [toolWindowId]: { ...toolWindow, placement, hidden: false },
    },
  };

  const withAdded = addToolWindow(nextState, nextState.toolWindows[toolWindowId]);

  if (index !== undefined) {
    return reorderPlacementItem(withAdded, placement, toolWindowId, index);
  }

  // Always activate the moved tool at its destination.
  return activateToolWindowState(withAdded, toolWindowId);
}

/**
 * Activate a tool window inside its current placement without moving it.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to activate.
 * @returns Updated state with `activeItemId` set to `toolWindowId`.
 */
export function activateToolWindowState(
  state: DockState,
  toolWindowId: string,
): DockState {
  const toolWindow = requireToolWindow(state, toolWindowId);
  const placement = state.placements[toolWindow.placement];

  return {
    ...state,
    placements: {
      ...state.placements,
      [toolWindow.placement]: { ...placement, activeItemId: toolWindowId },
    },
  };
}

/**
 * Deactivate a tool window by clearing its placement's active item pointer.
 *
 * The tool window remains in the placement stack; the panel collapses until
 * another item is activated.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to deactivate.
 * @returns Updated state with `activeItemId` cleared, or the original state
 * when the tool window is not the active item.
 */
export function deactivateToolWindowState(
  state: DockState,
  toolWindowId: string,
): DockState {
  const toolWindow = requireToolWindow(state, toolWindowId);
  const placement = state.placements[toolWindow.placement];

  if (placement.activeItemId !== toolWindowId) {
    return state;
  }

  return {
    ...state,
    placements: {
      ...state.placements,
      [toolWindow.placement]: { ...placement, activeItemId: undefined },
    },
  };
}

/**
 * Check whether a tool window is visible in any docked or floating surface.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to check.
 * @returns `true` when the tool window is visible to the user.
 */
export function isToolWindowVisibleState(state: DockState, toolWindowId: string): boolean {
  const toolWindow = state.toolWindows[toolWindowId];

  if (toolWindow?.hidden) {
    return false;
  }

  return (
    Object.values(state.placements).some((placement) => placement.itemIds.includes(toolWindowId)) ||
    state.floating.some((item) => item.kind === "tool-window" && item.id === toolWindowId)
  );
}

/**
 * Reinsert a docked item at a requested stack position.
 *
 * @param state - Current dock state.
 * @param placement - Placement whose stack should be reordered.
 * @param toolWindowId - Tool-window id to insert.
 * @param index - Desired zero-based stack index.
 * @returns State with the placement stack reordered.
 */
export function reorderPlacementItem(
  state: DockState,
  placement: DockedPlacement,
  toolWindowId: string,
  index: number,
): DockState {
  const placementState = state.placements[placement];
  const itemIds = placementState.itemIds.filter((id) => id !== toolWindowId);
  const nextIndex = Math.max(0, Math.min(index, itemIds.length));
  itemIds.splice(nextIndex, 0, toolWindowId);

  return {
    ...state,
    placements: {
      ...state.placements,
      [placement]: {
        ...placementState,
        itemIds,
        activeItemId: toolWindowId,
      },
    },
  };
}

/**
 * Require a tool-window state object before applying a state transition.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to read.
 * @returns The matching tool-window state.
 * @throws PlatformError when the id is unknown.
 */
export function requireToolWindow(state: DockState, toolWindowId: string): ToolWindowState {
  const toolWindow = state.toolWindows[toolWindowId];

  if (!toolWindow) {
    throw new PlatformError({
      code: dockErrorCodes.toolWindowMissing,
      message: `Tool window "${toolWindowId}" does not exist`,
      details: { toolWindowId },
    });
  }

  return toolWindow;
}

/**
 * Materialize a registered contribution into persisted tool-window state.
 *
 * @param toolWindowId - Tool-window id requested by the caller.
 * @param contribution - Optional registry contribution.
 * @returns Initial tool-window state derived from the contribution.
 * @throws PlatformError when no contribution exists for the id.
 */
function contributionToState(
  toolWindowId: string,
  contribution: ReturnType<ToolWindowContributionRegistry["get"]>,
): ToolWindowState {
  if (!contribution) {
    throw new PlatformError({
      code: dockErrorCodes.toolWindowMissing,
      message: `Tool window "${toolWindowId}" is not registered`,
      details: { toolWindowId },
    });
  }

  return createToolWindowState(contribution);
}
