import { createReactComponentRegistry } from "@ptl/platform-react";
import {
  createDockStateStore,
  createToolWindowContributionRegistry,
  type ToolWindowContribution,
  type WorkspaceItemState,
} from "@ptl/dock-core";

import {
  InspectorToolWindow,
  OutlineToolWindow,
  PlaybackToolWindow,
  QualityToolWindow,
  SubtitleDocumentPane,
  TimelineToolWindow,
  TracksToolWindow,
} from "./dock-components";

export const editorDockComponentIds = {
  subtitleDocument: "editor.workspace.subtitleDocument",
  outline: "editor.tool.outline",
  tracks: "editor.tool.tracks",
  inspector: "editor.tool.inspector",
  quality: "editor.tool.quality",
  playback: "editor.tool.playback",
  timeline: "editor.tool.timeline",
} as const;

export const editorDockToolWindowIds = {
  outline: "editor.outline",
  tracks: "editor.tracks",
  inspector: "editor.inspector",
  quality: "editor.quality",
  playback: "editor.playback",
  timeline: "editor.timeline",
} as const;

const editorDockComponents = {
  [editorDockComponentIds.subtitleDocument]: SubtitleDocumentPane,
  [editorDockComponentIds.outline]: OutlineToolWindow,
  [editorDockComponentIds.tracks]: TracksToolWindow,
  [editorDockComponentIds.inspector]: InspectorToolWindow,
  [editorDockComponentIds.quality]: QualityToolWindow,
  [editorDockComponentIds.playback]: PlaybackToolWindow,
  [editorDockComponentIds.timeline]: TimelineToolWindow,
};

const editorToolWindows = [
  {
    id: editorDockToolWindowIds.outline,
    title: "Outline",
    component: editorDockComponentIds.outline,
    preferredPlacement: "left-top",
    constraints: { minWidth: 12 },
  },
  {
    id: editorDockToolWindowIds.inspector,
    title: "Inspector",
    component: editorDockComponentIds.inspector,
    preferredPlacement: "right-top",
    constraints: { minWidth: 12 },
  },
  {
    id: editorDockToolWindowIds.tracks,
    title: "Tracks",
    component: editorDockComponentIds.tracks,
    preferredPlacement: "left-bottom",
    constraints: { minWidth: 12 },
  },
  {
    id: editorDockToolWindowIds.quality,
    title: "QC",
    component: editorDockComponentIds.quality,
    preferredPlacement: "right-bottom",
    constraints: { minWidth: 12 },
  },
  {
    id: editorDockToolWindowIds.playback,
    title: "Playback",
    component: editorDockComponentIds.playback,
    preferredPlacement: "bottom-right",
    constraints: { minHeight: 12 },
  },
  {
    id: editorDockToolWindowIds.timeline,
    title: "Timeline",
    component: editorDockComponentIds.timeline,
    preferredPlacement: "bottom-left",
    constraints: { minHeight: 12 },
  },
] satisfies readonly ToolWindowContribution[];

const editorWorkspaceItems = [
  {
    id: "subtitle-document",
    type: "subtitle-document",
    title: "Subtitles",
    component: editorDockComponentIds.subtitleDocument,
  },
] satisfies readonly WorkspaceItemState[];

export interface EditorDockSetup {
  components: ReturnType<typeof createReactComponentRegistry>;
  store: ReturnType<typeof createDockStateStore>;
  toolWindows: ReturnType<typeof createToolWindowContributionRegistry>;
}

/**
 * Create the editor dock shell from declarative component and tool-window lists.
 *
 * @example
 * ```ts
 * const dock = createEditorDock();
 * ```
 */
export function createEditorDock(): EditorDockSetup {
  const components = createReactComponentRegistry(editorDockComponents);
  const toolWindows = createToolWindowContributionRegistry(editorToolWindows);
  const store = createDockStateStore({ toolWindows });

  for (const item of editorWorkspaceItems) {
    store.openWorkspaceItem(item);
  }

  for (const toolWindow of editorToolWindows) {
    store.showToolWindow(toolWindow.id);
  }

  return { components, store, toolWindows };
}
