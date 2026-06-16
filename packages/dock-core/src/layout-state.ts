export type DockedPlacement =
  | "left-top"
  | "left-bottom"
  | "right-top"
  | "right-bottom"
  | "bottom-left"
  | "bottom-right";

/** Outer resizable dock areas that contain one or more dock placements. */
export type DockRegion = "left" | "right" | "bottom";

export type DockItemKind = "tool-window" | "workspace-item";

/**
 * Serializable state for one dock slot.
 *
 * Each placement may contain several tool windows, but the dock renders
 * only `activeItemId` in that placement. This lets hosts model stacks such as
 * "Problems" and "Terminal" while still keeping the visible shell simple.
 *
 * @example
 * ```ts
 * const placement: PlacementState = {
 *   id: "right-bottom",
 *   itemIds: ["problems", "terminal"],
 *   activeItemId: "terminal",
 * };
 * ```
 */
export interface PlacementState {
  id: DockedPlacement;
  itemIds: string[];
  activeItemId?: string;
  collapsed?: boolean;
}

/**
 * Runtime state for a registered tool window.
 *
 * `component` is resolved by the React/platform layer. `headerComponent` is an
 * optional renderer for custom panel chrome, for example a terminal header that
 * switches between multiple terminal sessions inside one tool window.
 *
 * @example
 * ```ts
 * const tool: ToolWindowState = {
 *   id: "terminal",
 *   title: "Terminal",
 *   component: "dock.terminal",
 *   headerComponent: "dock.terminal.header",
 *   placement: "bottom-left",
 * };
 * ```
 */
export interface ToolWindowState<TMeta = unknown> {
  id: string;
  title: string;
  component: string;
  headerComponent?: string;
  placement: DockedPlacement;
  order?: number;
  hidden?: boolean;
  metadata?: TMeta;
}

/**
 * Runtime state for one editor/workspace tab.
 *
 * Workspace items occupy the central dock area, while tool windows live in
 * docked placements around it.
 *
 * @example
 * ```ts
 * const item: WorkspaceItemState = {
 *   id: "subtitle-document",
 *   type: "subtitle-document",
 *   title: "Subtitles",
 *   component: "editor.workspace.subtitleDocument",
 * };
 * ```
 */
export interface WorkspaceItemState<TMeta = unknown> {
  id: string;
  type: string;
  title: string;
  component: string;
  metadata?: TMeta;
  dirty?: boolean;
  pinned?: boolean;
}

/** Central workspace collection and active item pointer. */
export interface WorkspaceState {
  itemIds: string[];
  items: Record<string, WorkspaceItemState>;
  activeItemId?: string;
}

/**
 * Persisted dock sizing.
 *
 * Placement sizes describe splits between sibling dock placements, for example
 * `left-top` versus `left-bottom` or `bottom-left` versus `bottom-right`.
 * Region sizes describe the outer dock shell, for example the left rail
 * width, right rail width, and bottom band height.
 * `workspace` is reserved for host shells that persist their central workspace
 * proportion.
 */
export interface DockSizeState {
  placements: Partial<Record<DockedPlacement, number>>;
  regions: Partial<Record<DockRegion, number>>;
  workspace?: number;
}

/** Floating tool/workspace item coordinates for future undocked windows. */
export interface FloatingItemState {
  id: string;
  kind: DockItemKind;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Last focused dock item. */
export interface FocusState {
  itemId: string;
  kind: DockItemKind;
}

/**
 * Complete serializable dock state.
 *
 * @example
 * ```ts
 * const state = createDockState();
 * state.placements["left-top"].itemIds;
 * ```
 */
export interface DockState {
  version: number;
  placements: Record<DockedPlacement, PlacementState>;
  toolWindows: Record<string, ToolWindowState>;
  workspace: WorkspaceState;
  sizes: DockSizeState;
  floating: FloatingItemState[];
  focus?: FocusState;
}

/**
 * All built-in dock slots supported by the default dock shell.
 *
 * The order is used when creating a fresh placement record, so additions should
 * be deliberate migration-level changes.
 */
export const dockedPlacements: readonly DockedPlacement[] = [
  "left-top",
  "left-bottom",
  "right-top",
  "right-bottom",
  "bottom-left",
  "bottom-right",
] as const;

/**
 * Create an empty placement record for every built-in dock slot.
 *
 * @returns Placement state keyed by dock placement.
 */
function createPlacementState(): Record<DockedPlacement, PlacementState> {
  const placements = {} as Record<DockedPlacement, PlacementState>;

  for (const placement of dockedPlacements) {
    placements[placement] = { id: placement, itemIds: [] };
  }

  return placements;
}

/**
 * Create an empty serializable dock layout.
 *
 * @example
 * ```ts
 * const state = createDockState();
 * JSON.stringify(state);
 * ```
 */
export function createDockState(): DockState {
  return {
    version: 1,
    placements: createPlacementState(),
    toolWindows: {},
    workspace: { itemIds: [], items: {} },
    sizes: { placements: {}, regions: {} },
    floating: [],
  };
}

/**
 * Add a tool window to its current placement and make the placement active when
 * it had no active item.
 *
 * @example
 * ```ts
 * const next = addToolWindow(state, {
 *   id: "outline",
 *   title: "Outline",
 *   component: "editor.outline",
 *   placement: "left-top",
 * });
 * ```
 */
export function addToolWindow<TMeta>(
  state: DockState,
  toolWindow: ToolWindowState<TMeta>,
): DockState {
  const placement = state.placements[toolWindow.placement];

  return {
    ...state,
    placements: {
      ...state.placements,
      [toolWindow.placement]: {
        ...placement,
        itemIds: [...placement.itemIds.filter((id) => id !== toolWindow.id), toolWindow.id],
        activeItemId: placement.activeItemId ?? toolWindow.id,
      },
    },
    toolWindows: {
      ...state.toolWindows,
      [toolWindow.id]: toolWindow,
    },
  };
}

/**
 * Add or replace a central workspace item.
 *
 * The existing item order is preserved except that the item is moved to the end
 * when reopened, matching editor-tab behavior.
 *
 * @example
 * ```ts
 * const next = addWorkspaceItem(state, {
 *   id: "doc",
 *   type: "text",
 *   title: "Document",
 *   component: "editor.text",
 * });
 * ```
 */
export function addWorkspaceItem<TMeta>(
  state: DockState,
  item: WorkspaceItemState<TMeta>,
): DockState {
  return {
    ...state,
    workspace: {
      itemIds: [...state.workspace.itemIds.filter((id) => id !== item.id), item.id],
      items: {
        ...state.workspace.items,
        [item.id]: item,
      },
      activeItemId: state.workspace.activeItemId ?? item.id,
    },
  };
}
