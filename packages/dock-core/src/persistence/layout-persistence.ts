import type {
  FloatingItemState,
  FocusState,
  PlacementState,
  ToolWindowState,
  DockSizeState,
  DockState,
  WorkspaceState,
} from "../layout-state";

export interface MissingDockContributionState {
  kind: "tool-window" | "workspace-item";
  id: string;
  component: string;
  state: unknown;
}

export interface PersistedDockUserLayout {
  placements: DockState["placements"];
  sizes: DockSizeState;
  toolWindows: Record<string, ToolWindowState>;
}

export interface PersistedDockProjectLayout {
  workspace: WorkspaceState;
}

export interface PersistedDockSessionState {
  floating: FloatingItemState[];
  focus?: FocusState;
}

export interface PersistedDockLayout {
  version: number;
  userLayout: PersistedDockUserLayout;
  projectLayout: PersistedDockProjectLayout;
  sessionState: PersistedDockSessionState;
  missingContributions: MissingDockContributionState[];
}

export interface DockLayoutMigration {
  fromVersion: number;
  toVersion: number;
  migrate(layout: PersistedDockLayout): PersistedDockLayout;
}

export interface RestoreDockLayoutOptions {
  availableComponents?: ReadonlySet<string>;
  migrations?: readonly DockLayoutMigration[];
}

/**
 * Split the live dock state into persistence layers.
 *
 * @example
 * ```ts
 * const persisted = serializeDockLayout(state);
 * localStorage.setItem("dock", JSON.stringify(persisted.userLayout));
 * ```
 */
export function serializeDockLayout(state: DockState): PersistedDockLayout {
  return {
    version: state.version,
    userLayout: {
      placements: state.placements,
      sizes: state.sizes,
      toolWindows: state.toolWindows,
    },
    projectLayout: {
      workspace: state.workspace,
    },
    sessionState: {
      floating: state.floating,
      focus: state.focus,
    },
    missingContributions: [],
  };
}

/**
 * Restore a dock state and preserve missing plugin/component state.
 *
 * Missing contributions are removed from active placement/workspace lists but
 * kept in `missingContributions` so reinstalling a plugin can recover them.
 */
export function restoreDockLayout(
  layout: PersistedDockLayout,
  options: RestoreDockLayoutOptions = {},
): { state: DockState; missingContributions: MissingDockContributionState[] } {
  const migrated = applyDockLayoutMigrations(layout, options.migrations ?? []);
  const missingContributions = [...migrated.missingContributions];
  const toolWindows: Record<string, ToolWindowState> = {};
  const workspaceItems = { ...migrated.projectLayout.workspace.items };

  for (const [id, toolWindow] of Object.entries(migrated.userLayout.toolWindows)) {
    if (isComponentAvailable(toolWindow.component, options.availableComponents)) {
      toolWindows[id] = toolWindow;
    } else {
      missingContributions.push({
        kind: "tool-window",
        id,
        component: toolWindow.component,
        state: toolWindow,
      });
    }
  }

  for (const [id, item] of Object.entries(workspaceItems)) {
    if (!isComponentAvailable(item.component, options.availableComponents)) {
      delete workspaceItems[id];
      missingContributions.push({
        kind: "workspace-item",
        id,
        component: item.component,
        state: item,
      });
    }
  }

  return {
    state: {
      version: migrated.version,
      placements: prunePlacementState(migrated.userLayout.placements, toolWindows),
      toolWindows,
      workspace: {
        itemIds: migrated.projectLayout.workspace.itemIds.filter((id) => id in workspaceItems),
        items: workspaceItems,
        activeItemId: workspaceItems[migrated.projectLayout.workspace.activeItemId ?? ""]
          ? migrated.projectLayout.workspace.activeItemId
          : undefined,
      },
      sizes: migrated.userLayout.sizes,
      floating: migrated.sessionState.floating.filter((item) =>
        item.kind === "tool-window" ? item.id in toolWindows : item.id in workspaceItems,
      ),
      focus: migrated.sessionState.focus,
    },
    missingContributions,
  };
}

export function applyDockLayoutMigrations(
  layout: PersistedDockLayout,
  migrations: readonly DockLayoutMigration[],
): PersistedDockLayout {
  return migrations
    .toSorted((left, right) => left.fromVersion - right.fromVersion)
    .reduce(
      (current, migration) =>
        current.version === migration.fromVersion ? migration.migrate(current) : current,
      layout,
    );
}

function prunePlacementState(
  placements: DockState["placements"],
  toolWindows: Record<string, ToolWindowState>,
): DockState["placements"] {
  const next = {} as DockState["placements"];

  for (const [id, placement] of Object.entries(placements) as [
    keyof DockState["placements"],
    PlacementState,
  ][]) {
    const itemIds = placement.itemIds.filter((itemId) => itemId in toolWindows);
    next[id] = {
      ...placement,
      itemIds,
      activeItemId: itemIds.includes(placement.activeItemId ?? "")
        ? placement.activeItemId
        : undefined,
    };
  }

  return next;
}

function isComponentAvailable(
  component: string,
  availableComponents: ReadonlySet<string> | undefined,
): boolean {
  return !availableComponents || availableComponents.has(component);
}
