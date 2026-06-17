import {
  addToolWindow,
  addWorkspaceItem,
  createDockState,
  DockStateStore,
  dockTools,
  dockWorkspaceEditors,
  type DockedPlacement,
  type DockState,
  type ToolDefinition,
  type ToolWindowState,
  type WorkspaceEditorDefinition,
  type WorkspaceItemState,
} from "@ptl/dock-core";
import { useContributions } from "@ptl/platform-react";
import { cn } from "@ptl/ui";
import * as React from "react";

import { DockDragDropContext } from "./dock-drag-drop-context";
import { DockLayout, type DockLayoutProps } from "./dock-layout";
import { DockToolRail } from "./dock-tool-rail";
import { DockProvider } from "../provider/dock-provider";
import type { ToolPanelProps } from "../index";

export interface DockLayoutToolPreset {
  readonly placement?: DockedPlacement;
  readonly visible?: boolean;
}

export interface DockLayoutWorkspacePreset {
  readonly editorId: string;
  readonly active?: boolean;
}

export interface DockContributionLayoutPreset {
  readonly workspace?: readonly DockLayoutWorkspacePreset[];
  readonly tools?: Readonly<Record<string, DockLayoutToolPreset>>;
}

export interface DockContributionLayoutProps extends Omit<
  DockLayoutProps,
  "renderToolWindow" | "renderToolWindowHeader" | "renderWorkspaceItem"
> {
  readonly preset?: DockContributionLayoutPreset;
}

/**
 * Headless platform-contribution dock renderer.
 *
 * The component reads `dock.tools` and `dock.workspace-editors` contributions,
 * builds serializable dock state from an optional layout preset, and delegates
 * all chrome to the generic `DockLayout`. Applications only provide plugins and
 * a preset instead of hand-wiring dock panels in app code.
 */
export function DockContributionLayout({
  preset,
  dragAndDrop = true,
  ...layoutProps
}: DockContributionLayoutProps) {
  const tools = useContributions(dockTools);
  const workspaceEditors = useContributions(dockWorkspaceEditors);
  const initialState = React.useMemo(
    () => createContributionDockState({ preset, tools, workspaceEditors }),
    [preset, tools, workspaceEditors],
  );
  const store = React.useMemo(() => new DockStateStore({ initialState }), [initialState]);
  const toolById = React.useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);
  const editorById = React.useMemo(
    () => new Map(workspaceEditors.map((editor) => [editor.id, editor])),
    [workspaceEditors],
  );

  return (
    <DockProvider store={store}>
      <DockDragDropContext>
        <div className="flex h-full min-h-0">
          <DockToolRail side="left" tools={tools} />
          <DockLayout
            {...layoutProps}
            className={cn("min-h-0 flex-1", layoutProps.className)}
            dragAndDrop={dragAndDrop}
            renderToolWindow={(toolWindow) => renderToolWindow(toolWindow, toolById)}
            renderToolWindowHeader={(toolWindow) => renderToolWindowHeader(toolWindow, toolById)}
            renderWorkspaceItem={(item) => renderWorkspaceItem(item, editorById)}
          />
          <DockToolRail side="right" tools={tools} />
        </div>
      </DockDragDropContext>
    </DockProvider>
  );
}

export function createContributionDockState(options: {
  readonly preset?: DockContributionLayoutPreset;
  readonly tools: readonly ToolDefinition<unknown, unknown, unknown>[];
  readonly workspaceEditors: readonly WorkspaceEditorDefinition<unknown, unknown, unknown>[];
}): DockState {
  let state = createDockState();

  for (const editor of options.workspaceEditors) {
    const workspacePreset = options.preset?.workspace?.find(
      (entry) => entry.editorId === editor.id,
    );

    if (!workspacePreset && options.preset?.workspace?.length) {
      continue;
    }

    state = addWorkspaceItem(state, {
      id: editor.id,
      type: editor.id,
      title: getLocalizedText(editor.getTitle?.({ resource: undefined }) ?? editor.id),
      component: editor.id,
    });

    if (workspacePreset?.active) {
      state = { ...state, workspace: { ...state.workspace, activeItemId: editor.id } };
    }
  }

  for (const tool of options.tools) {
    const toolPreset = options.preset?.tools?.[tool.id];
    const placement = toolPreset?.placement ?? tool.preferredPlacement ?? "right-bottom";
    const hidden = toolPreset?.visible === false;

    state = addToolWindow(state, {
      id: tool.id,
      title: getLocalizedText(tool.title),
      component: tool.id,
      headerComponent: tool.header ? `${tool.id}.header` : undefined,
      placement,
      hidden,
    });

    if (hidden) {
      const placementState = state.placements[placement];
      const itemIds = placementState.itemIds.filter((id) => id !== tool.id);
      state = {
        ...state,
        placements: {
          ...state.placements,
          [placement]: {
            ...placementState,
            itemIds,
            activeItemId:
              placementState.activeItemId === tool.id
                ? itemIds.at(-1)
                : placementState.activeItemId,
          },
        },
      };
    }
  }

  return state;
}

function renderToolWindow(
  toolWindow: ToolWindowState,
  tools: ReadonlyMap<string, ToolDefinition<unknown, unknown, unknown>>,
) {
  const tool = tools.get(toolWindow.id);

  if (!tool) return toolWindow.title;

  const Panel = tool.panel as React.ComponentType<ToolPanelProps>;

  return (
    <Panel
      toolId={tool.id}
      instanceId={toolWindow.id}
      state={undefined}
      active
      visible
      actions={emptyActions}
      updateState={() => undefined}
    />
  );
}

function renderToolWindowHeader(
  toolWindow: ToolWindowState,
  tools: ReadonlyMap<string, ToolDefinition<unknown, unknown, unknown>>,
) {
  const Header = tools.get(toolWindow.id)?.header as
    | React.ComponentType<ToolPanelProps>
    | undefined;

  return Header ? (
    <Header
      toolId={toolWindow.id}
      instanceId={toolWindow.id}
      state={undefined}
      active
      visible
      actions={emptyActions}
      updateState={() => undefined}
    />
  ) : undefined;
}

function renderWorkspaceItem(
  item: WorkspaceItemState,
  editors: ReadonlyMap<string, WorkspaceEditorDefinition<unknown, unknown, unknown>>,
) {
  const editor = editors.get(item.type);

  if (!editor) return item.title;

  const Panel = editor.panel as React.ComponentType<{ item: WorkspaceItemState }>;
  return <Panel item={item} />;
}

function getLocalizedText(text: unknown): string {
  if (typeof text === "string") return text;
  if (text && typeof text === "object" && "defaultMessage" in text) {
    return String((text as { readonly defaultMessage: unknown }).defaultMessage);
  }
  return String(text ?? "");
}

const emptyActions = {
  close() {},
  hide() {},
  focus() {},
  move() {},
};
