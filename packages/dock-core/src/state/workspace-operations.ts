import { PlatformError } from "@ptl/platform-core";

import { dockErrorCodes } from "../errors";
import {
  addWorkspaceItem,
  type DockState,
  type WorkspaceItemState,
} from "../layout-state";

/** Add or replace a workspace item and make it active. */
export function openWorkspaceItemState(
  state: DockState,
  item: WorkspaceItemState,
): DockState {
  return addWorkspaceItem(state, item);
}

/** Close a workspace item by id. */
export function closeWorkspaceItemState(state: DockState, itemId: string): DockState {
  if (!state.workspace.items[itemId]) {
    throw new PlatformError({
      code: dockErrorCodes.workspaceItemMissing,
      message: `Workspace item "${itemId}" does not exist`,
      details: { itemId },
    });
  }

  const { [itemId]: _removed, ...items } = state.workspace.items;
  const itemIds = state.workspace.itemIds.filter((id) => id !== itemId);

  return {
    ...state,
    workspace: {
      itemIds,
      items,
      activeItemId:
        state.workspace.activeItemId === itemId ? itemIds.at(-1) : state.workspace.activeItemId,
    },
  };
}

/** Activate an existing workspace item by id. */
export function activateWorkspaceItemState(
  state: DockState,
  itemId: string,
): DockState {
  if (!state.workspace.items[itemId]) {
    throw new PlatformError({
      code: dockErrorCodes.workspaceItemMissing,
      message: `Workspace item "${itemId}" does not exist`,
      details: { itemId },
    });
  }

  return {
    ...state,
    workspace: {
      ...state.workspace,
      activeItemId: itemId,
    },
  };
}
