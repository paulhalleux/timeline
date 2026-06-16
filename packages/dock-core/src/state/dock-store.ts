import { Store } from "@ptl/store";

import {
  createDockState,
  type DockedPlacement,
  type FloatingItemState,
  type ToolWindowState,
  type DockRegion,
  type DockState,
  type WorkspaceItemState,
} from "../layout-state";
import type { ToolWindowContributionRegistry } from "../tool-windows/tool-window-contributions";
import type { DockApi, DockStateStoreOptions } from "./dock-api";
import {
  dockToolWindowState,
  floatToolWindowState,
  moveFloatingItemState,
} from "./floating-operations";
import {
  activateToolWindowState,
  deactivateToolWindowState,
  hideToolWindowState,
  isToolWindowVisibleState,
  moveToolWindowState,
  showToolWindowState,
} from "./tool-window-operations";
import {
  resizeRegionState,
  resizeToolWindowPlacementState,
} from "./size-operations";
import {
  activateWorkspaceItemState,
  closeWorkspaceItemState,
  openWorkspaceItemState,
} from "./workspace-operations";

/**
 * Store-first dock state owner.
 *
 * @example
 * ```ts
 * const dock = new DockStateStore({ toolWindows });
 * dock.showToolWindow("outline");
 * dock.resize("left-top", 60);
 * dock.subscribe(() => persist(dock.getState()));
 * ```
 */
export class DockStateStore implements DockApi {
  private readonly store: Store<DockState>;
  private readonly toolWindows?: ToolWindowContributionRegistry;

  constructor(options: DockStateStoreOptions = {}) {
    this.store = new Store(options.initialState ?? createDockState());
    this.toolWindows = options.toolWindows;
  }

  /**
   * Return the underlying observable store for framework bindings.
   *
   * @returns Store instance owned by this API.
   *
   * @example
   * ```ts
   * const snapshot = dock.getStore().get();
   * ```
   */
  getStore(): Store<DockState> {
    return this.store;
  }

  /**
   * Subscribe to any state change without immediately reading a value.
   *
   * @param listener - Callback invoked after each state update.
   * @returns Disposable unsubscribe callback.
   *
   * @example
   * ```ts
   * const unsubscribe = dock.subscribe(render);
   * unsubscribe();
   * ```
   */
  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Read the current immutable dock snapshot.
   *
   * @returns Latest dock state.
   */
  getState(): DockState {
    return this.store.get();
  }

  /**
   * Replace the current snapshot, for example after loading persisted layout.
   *
   * @param state - Full dock state to install.
   */
  setState(state: DockState): void {
    this.store.set(state);
  }

  /**
   * Show a registered tool window in its current or contributed placement.
   *
   * @param toolWindowId - Tool-window id to make visible.
   */
  showToolWindow(toolWindowId: string): void {
    this.updateState((state) => showToolWindowState(state, toolWindowId, this.toolWindows));
  }

  /**
   * Activate a tool window inside its current placement without moving it.
   *
   * @param toolWindowId - Tool-window id to set as the active item.
   */
  activateToolWindow(toolWindowId: string): void {
    this.updateState((state) => activateToolWindowState(state, toolWindowId));
  }

  /**
   * Deactivate a tool window so its placement panel collapses.
   *
   * The tool window remains in the placement stack and can be reactivated.
   *
   * @param toolWindowId - Tool-window id to deactivate.
   */
  deactivateToolWindow(toolWindowId: string): void {
    this.updateState((state) => deactivateToolWindowState(state, toolWindowId));
  }

  /**
   * Hide a visible tool window when its contribution allows hiding.
   *
   * @param toolWindowId - Tool-window id to hide from sidebars and panels.
   */
  hideToolWindow(toolWindowId: string): void {
    this.updateState((state) => hideToolWindowState(state, toolWindowId, this.toolWindows));
  }

  /**
   * Toggle a tool window between visible and hidden states.
   *
   * @param toolWindowId - Tool-window id to toggle.
   */
  toggleToolWindow(toolWindowId: string): void {
    if (isToolWindowVisibleState(this.getState(), toolWindowId)) {
      this.hideToolWindow(toolWindowId);
      return;
    }

    this.showToolWindow(toolWindowId);
  }

  /**
   * Move a tool window to a dock placement and optional stack index.
   *
   * @param toolWindowId - Tool-window id to move.
   * @param placement - Destination placement.
   * @param index - Optional stack index inside the placement.
   */
  moveToolWindow(toolWindowId: string, placement: DockedPlacement, index?: number): void {
    this.updateState((state) =>
      moveToolWindowState(state, toolWindowId, placement, index, this.toolWindows),
    );
  }

  /**
   * Undock a tool window into a floating panel.
   *
   * @param toolWindowId - Tool-window id to float.
   * @param bounds - Optional initial panel bounds in dock pixels.
   */
  floatToolWindow(
    toolWindowId: string,
    bounds?: Partial<Pick<FloatingItemState, "x" | "y" | "width" | "height">>,
  ): void {
    this.updateState((state) => floatToolWindowState(state, toolWindowId, bounds));
  }

  /**
   * Dock a floating tool window back into a placement.
   *
   * @param toolWindowId - Tool-window id to dock.
   * @param placement - Optional destination placement.
   * @param index - Optional destination stack index.
   */
  dockToolWindow(toolWindowId: string, placement?: DockedPlacement, index?: number): void {
    this.updateState((state) => dockToolWindowState(state, toolWindowId, placement, index));
  }

  /**
   * Move a floating item to new pixel coordinates.
   *
   * @param itemId - Floating item id to move.
   * @param x - New x coordinate.
   * @param y - New y coordinate.
   */
  moveFloatingItem(itemId: string, x: number, y: number): void {
    this.updateState((state) => moveFloatingItemState(state, itemId, x, y));
  }

  /**
   * Persist the split size of one dock placement inside its region.
   *
   * @param placement - Dock placement being resized.
   * @param size - Percent size inside the placement group.
   */
  resizeToolWindow(placement: DockedPlacement, size: number): void {
    this.updateState((state) =>
      resizeToolWindowPlacementState(state, placement, size, this.toolWindows),
    );
  }

  /**
   * Persist the split size of one dock placement inside its region.
   *
   * @example
   * ```ts
   * dock.resize("bottom-left", 65);
   * ```
   */
  resize(placement: DockedPlacement, size: number): void {
    this.resizeToolWindow(placement, size);
  }

  /**
   * Persist the outer size of a left, right, or bottom dock region.
   *
   * @param region - Dock region being resized.
   * @param size - Percent size inside the root layout.
   */
  resizeRegion(region: DockRegion, size: number): void {
    this.updateState((state) => resizeRegionState(state, region, size));
  }

  /**
   * Add or replace a central workspace item and make it active.
   *
   * @param item - Workspace item state to open.
   */
  openWorkspaceItem(item: WorkspaceItemState): void {
    this.updateState((state) => openWorkspaceItemState(state, item));
  }

  /**
   * Close a central workspace item by id.
   *
   * @param itemId - Workspace item id to close.
   */
  closeWorkspaceItem(itemId: string): void {
    this.updateState((state) => closeWorkspaceItemState(state, itemId));
  }

  /**
   * Activate an existing central workspace item by id.
   *
   * @param itemId - Workspace item id to activate.
   */
  activateWorkspaceItem(itemId: string): void {
    this.updateState((state) => activateWorkspaceItemState(state, itemId));
  }

  /**
   * Read a registered or previously shown tool window by id.
   *
   * @param id - Tool-window id to read.
   * @returns Tool-window state when available.
   */
  getToolWindow(id: string): ToolWindowState | undefined {
    return this.getState().toolWindows[id];
  }

  /**
   * Read a central workspace item by id.
   *
   * @param id - Workspace item id to read.
   * @returns Workspace item state when available.
   */
  getWorkspaceItem(id: string): WorkspaceItemState | undefined {
    return this.getState().workspace.items[id];
  }

  /**
   * Apply one immutable state transition through the shared store package.
   *
   * @param createNext - Pure operation that returns the next state snapshot.
   */
  private updateState(createNext: (state: DockState) => DockState): void {
    this.store.update((draft) => {
      Object.assign(draft, createNext(draft as DockState));
    });
  }
}

/**
 * Create a fresh empty dock state using the default layout schema.
 *
 * @returns A new serializable `DockState`.
 *
 * @example
 * ```ts
 * const dock = new DockStateStore({
 *   initialState: createDefaultDockState(),
 * });
 * ```
 */
export function createDefaultDockState(): DockState {
  return createDockState();
}
