import type {
  DockedPlacement,
  FloatingItemState,
  ToolWindowState,
  DockRegion,
  DockState,
  WorkspaceItemState,
} from "../layout-state";
import type { ToolWindowContributionRegistry } from "../tool-windows/tool-window-contributions";

/**
 * Options used to construct a dock state store.
 *
 * @example
 * ```ts
 * const dock = new DockStateStore({
 *   initialState: restoredLayout.state,
 *   toolWindows,
 * });
 * ```
 */
export interface DockStateStoreOptions {
  /**
   * Initial state snapshot, usually loaded from layout persistence.
   *
   * @default createDockState()
   */
  initialState?: DockState;
  /**
   * Registry used when a tool window is shown before it exists in state.
   *
   * The store reads the contribution, creates a `ToolWindowState`, and then
   * inserts it into the requested placement.
   */
  toolWindows?: ToolWindowContributionRegistry;
}

/**
 * Imperative dock API exposed to hosts and React components.
 *
 * This is intentionally store-shaped: consumers call methods such as
 * `resize(...)` or `moveToolWindow(...)` instead of constructing command payload
 * objects.
 *
 * @example
 * ```ts
 * function openOutline(dock: DockApi) {
 *   dock.showToolWindow("outline");
 * }
 * ```
 */
export interface DockApi {
  /**
   * Read the latest immutable state snapshot held by the store.
   *
   * @returns Current dock state.
   */
  getState(): DockState;
  /**
   * Subscribe to any state change.
   *
   * @param listener - Called after the store commits a changed state.
   * @returns A function that removes the subscription.
   */
  subscribe(listener: () => void): () => void;
  /**
   * Show a registered or previously hidden tool window.
   *
   * @param toolWindowId - Registered tool-window id to show.
   */
  showToolWindow(toolWindowId: string): void;

  /**
   * Activate a tool window inside its current placement without moving it.
   *
   * @param toolWindowId - Tool-window id to set as the active item.
   */
  activateToolWindow(toolWindowId: string): void;

  /**
   * Deactivate a tool window so its placement panel collapses.
   *
   * The tool window remains in the placement stack and can be reactivated.
   *
   * @param toolWindowId - Tool-window id to deactivate.
   */
  deactivateToolWindow(toolWindowId: string): void;

  /**
   * Hide a tool window completely from docked sidebars and floating panels.
   *
   * @param toolWindowId - Visible tool-window id to hide.
   */
  hideToolWindow(toolWindowId: string): void;

  /**
   * Toggle a tool window between visible and hidden states.
   *
   * @param toolWindowId - Tool-window id to toggle.
   */
  toggleToolWindow(toolWindowId: string): void;
  /**
   * Move a tool window to a placement and optional stack index.
   *
   * @param toolWindowId - Tool-window id to move.
   * @param placement - Destination dock placement.
   * @param index - Optional zero-based position inside the destination stack.
   */
  moveToolWindow(toolWindowId: string, placement: DockedPlacement, index?: number): void;
  /**
   * Undock a tool window into a floating panel.
   *
   * @param toolWindowId - Tool-window id to float.
   * @param bounds - Optional initial floating bounds in dock pixels.
   */
  floatToolWindow(
    toolWindowId: string,
    bounds?: Partial<Pick<FloatingItemState, "x" | "y" | "width" | "height">>,
  ): void;
  /**
   * Dock a floating tool window back into a placement.
   *
   * @param toolWindowId - Floating tool-window id to dock.
   * @param placement - Optional destination. When omitted, the last placement is reused.
   * @param index - Optional destination stack index.
   */
  dockToolWindow(toolWindowId: string, placement?: DockedPlacement, index?: number): void;
  /**
   * Move an existing floating item.
   *
   * @param itemId - Floating item id to move.
   * @param x - New x position in dock pixels.
   * @param y - New y position in dock pixels.
   */
  moveFloatingItem(itemId: string, x: number, y: number): void;
  /**
   * Persist a placement split size.
   *
   * @param placement - Placement whose split size changed.
   * @param size - Percent-like size emitted by the panel library.
   */
  resize(placement: DockedPlacement, size: number): void;
  /**
   * Persist a placement split size.
   *
   * @param placement - Placement whose split size changed.
   * @param size - Percent-like size emitted by the panel library.
   */
  resizeToolWindow(placement: DockedPlacement, size: number): void;
  /**
   * Persist an outer region size.
   *
   * @param region - Left, right, or bottom dock region.
   * @param size - Percent-like size emitted by the panel library.
   */
  resizeRegion(region: DockRegion, size: number): void;
  /**
   * Open a workspace item and make it active.
   *
   * @param item - Workspace item descriptor to open and activate.
   */
  openWorkspaceItem(item: WorkspaceItemState): void;

  /**
   * Close a central workspace item.
   *
   * @param itemId - Workspace item id to close.
   */
  closeWorkspaceItem(itemId: string): void;

  /**
   * Activate an existing central workspace item.
   *
   * @param itemId - Workspace item id to activate.
   */
  activateWorkspaceItem(itemId: string): void;
  /**
   * Read a registered or previously shown tool window.
   *
   * @param id - Tool-window id to look up.
   * @returns The tool-window state, if known.
   */
  getToolWindow(id: string): ToolWindowState | undefined;
  /**
   * Read a central workspace item.
   *
   * @param id - Workspace item id to look up.
   * @returns The workspace item state, if known.
   */
  getWorkspaceItem(id: string): WorkspaceItemState | undefined;
}
