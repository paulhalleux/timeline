import { PlatformError } from "@ptl/platform-core";

import { dockErrorCodes } from "../errors";
import {
  addToolWindow,
  type DockedPlacement,
  type FloatingItemState,
  type ToolWindowState,
  type DockState,
} from "../layout-state";
import { activateToolWindowState, reorderPlacementItem, requireToolWindow } from "./tool-window-operations";

/**
 * Undock a tool window into the floating layer.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to float.
 * @param bounds - Optional initial floating bounds.
 * @returns Dock state with the tool removed from placements and added to
 * the floating collection.
 */
export function floatToolWindowState(
  state: DockState,
  toolWindowId: string,
  bounds: Partial<Pick<FloatingItemState, "x" | "y" | "width" | "height">> = {},
): DockState {
  const toolWindow = requireToolWindow(state, toolWindowId);
  const placement = state.placements[toolWindow.placement];
  const itemIds = placement.itemIds.filter((id) => id !== toolWindowId);
  const floatingItem: FloatingItemState = {
    id: toolWindowId,
    kind: "tool-window",
    x: bounds.x ?? 96,
    y: bounds.y ?? 72,
    width: bounds.width ?? 360,
    height: bounds.height ?? 260,
  };

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
      [toolWindowId]: { ...toolWindow, hidden: false },
    },
    floating: [...state.floating.filter((item) => item.id !== toolWindowId), floatingItem],
  };
}

/**
 * Dock a floating tool window back into a placement.
 *
 * @param state - Current dock state.
 * @param toolWindowId - Tool-window id to dock.
 * @param placement - Optional destination placement.
 * @param index - Optional destination stack index.
 * @returns Dock state with the item removed from the floating layer.
 */
export function dockToolWindowState(
  state: DockState,
  toolWindowId: string,
  placement?: DockedPlacement,
  index?: number,
): DockState {
  const toolWindow = requireToolWindow(state, toolWindowId);
  const targetPlacement = placement ?? toolWindow.placement;
  const nextState: DockState = {
    ...removeFloatingItem(state, toolWindowId),
    toolWindows: {
      ...state.toolWindows,
      [toolWindowId]: { ...toolWindow, placement: targetPlacement, hidden: false },
    },
  };

  const withAdded = addToolWindow(nextState, nextState.toolWindows[toolWindowId]);

  if (index !== undefined) {
    return reorderPlacementItem(withAdded, targetPlacement, toolWindowId, index);
  }

  return activateToolWindowState(withAdded, toolWindowId);
}

/**
 * Move a floating item to new pixel coordinates.
 *
 * @param state - Current dock state.
 * @param itemId - Floating item id to move.
 * @param x - New x coordinate.
 * @param y - New y coordinate.
 * @returns Dock state with updated floating coordinates.
 */
export function moveFloatingItemState(
  state: DockState,
  itemId: string,
  x: number,
  y: number,
): DockState {
  return {
    ...state,
    floating: state.floating.map((item) => (item.id === itemId ? { ...item, x, y } : item)),
  };
}

/**
 * Remove one item from the floating layer.
 *
 * @param state - Current dock state.
 * @param itemId - Floating item id to remove.
 * @returns Dock state without the floating item.
 */
export function removeFloatingItem(state: DockState, itemId: string): DockState {
  return {
    ...state,
    floating: state.floating.filter((item) => item.id !== itemId),
  };
}
