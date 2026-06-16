import type {
  DockedPlacement,
  ToolWindowState,
  DockState,
  WorkspaceItemState,
} from "@ptl/dock-core";

/**
 * Return visible tool windows for one dock placement in stack order.
 *
 * @param state - Current dock state.
 * @param placement - Dock placement to inspect.
 * @returns Tool-window states that should render inside the placement.
 */
export function getPlacementToolWindows(
  state: DockState,
  placement: DockedPlacement,
): ToolWindowState[] {
  return state.placements[placement].itemIds
    .map((id) => state.toolWindows[id])
    .filter((toolWindow): toolWindow is ToolWindowState => Boolean(toolWindow && !toolWindow.hidden));
}

/**
 * Resolve the active visible tool window for one dock placement.
 *
 * Returns `undefined` when no item is explicitly active, allowing the panel
 * to collapse when the user deactivates the current tool.
 *
 * @param state - Current dock state.
 * @param placement - Dock placement to inspect.
 * @returns Active tool window, or `undefined` when `activeItemId` is not set.
 */
export function getActiveToolWindow(
  state: DockState,
  placement: DockedPlacement,
): ToolWindowState | undefined {
  const { activeItemId } = state.placements[placement];

  return activeItemId ? state.toolWindows[activeItemId] : undefined;
}

/**
 * Return central workspace items in persisted tab order.
 *
 * @param state - Current dock state.
 * @returns Workspace item states that should render as tabs.
 */
export function getWorkspaceItems(state: DockState): WorkspaceItemState[] {
  return state.workspace.itemIds
    .map((id) => state.workspace.items[id])
    .filter((item): item is WorkspaceItemState => Boolean(item));
}

/**
 * Resolve the active central workspace item.
 *
 * @param state - Current dock state.
 * @returns Active workspace item, or the last item when no active id is set.
 */
export function getActiveWorkspaceItem(state: DockState): WorkspaceItemState | undefined {
  const activeId = state.workspace.activeItemId ?? state.workspace.itemIds.at(-1);

  return activeId ? state.workspace.items[activeId] : undefined;
}
