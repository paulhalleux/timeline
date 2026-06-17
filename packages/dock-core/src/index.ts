export {
  addToolWindow,
  addWorkspaceItem,
  createDockState,
  dockedPlacements,
  type DockedPlacement,
  type FloatingItemState,
  type FocusState,
  type PlacementState,
  type ToolWindowState,
  type DockItemKind,
  type DockRegion,
  type DockSizeState,
  type DockState,
  type WorkspaceItemState,
  type WorkspaceState,
} from "./layout-state";
export { dockErrorCodes } from "./errors";
export {
  applyDockLayoutMigrations,
  restoreDockLayout,
  serializeDockLayout,
  type MissingDockContributionState,
  type PersistedDockLayout,
  type PersistedDockProjectLayout,
  type PersistedDockSessionState,
  type PersistedDockUserLayout,
  type RestoreDockLayoutOptions,
  type DockLayoutMigration,
} from "./persistence/layout-persistence";
export {
  LayoutPresetRegistry,
  DockStateBuilder,
  type LayoutPresetContribution,
  type DockLayoutBuilder,
} from "./presets/layout-presets";
export {
  ToolWindowContributionRegistry,
  createToolWindowState,
  type ToolWindowConstraints,
  type ToolWindowContribution,
  type ToolWindowContributionSource,
} from "./tool-windows/tool-window-contributions";
export {
  createDefaultDockState,
  DockStateStore,
} from "./state/dock-store";
export {
  type DockApi,
  type DockStateStoreOptions,
} from "./state/dock-api";
export {
  createDockCommandDefinitions,
  registerDockCommands,
  dockCommandIds,
} from "./state/dock-commands";
export {
  WorkspaceItemTypeRegistry,
  type WorkspaceItemTypeContribution,
} from "./workspace/item-types";
