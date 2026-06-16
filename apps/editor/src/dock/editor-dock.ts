import { ReactComponentRegistry } from "@ptl/platform-react";
import { ToolWindowContributionRegistry, DockStateStore } from "@ptl/dock-core";

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

export interface EditorDockSetup {
  components: ReactComponentRegistry;
  store: DockStateStore;
  toolWindows: ToolWindowContributionRegistry;
}

/**
 * Create the editor dock shell and register its React components.
 *
 * @example
 * ```ts
 * const dock = createEditorDock();
 * ```
 */
export function createEditorDock(): EditorDockSetup {
  const components = new ReactComponentRegistry();
  components.register(editorDockComponentIds.subtitleDocument, SubtitleDocumentPane);
  components.register(editorDockComponentIds.outline, OutlineToolWindow);
  components.register(editorDockComponentIds.tracks, TracksToolWindow);
  components.register(editorDockComponentIds.inspector, InspectorToolWindow);
  components.register(editorDockComponentIds.quality, QualityToolWindow);
  components.register(editorDockComponentIds.playback, PlaybackToolWindow);
  components.register(editorDockComponentIds.timeline, TimelineToolWindow);

  const toolWindows = new ToolWindowContributionRegistry();
  toolWindows.register({
    id: editorDockToolWindowIds.outline,
    title: "Outline",
    component: editorDockComponentIds.outline,
    preferredPlacement: "left-top",
    constraints: { minWidth: 12 },
  });
  toolWindows.register({
    id: editorDockToolWindowIds.inspector,
    title: "Inspector",
    component: editorDockComponentIds.inspector,
    preferredPlacement: "right-top",
    constraints: { minWidth: 12 },
  });
  toolWindows.register({
    id: editorDockToolWindowIds.tracks,
    title: "Tracks",
    component: editorDockComponentIds.tracks,
    preferredPlacement: "left-bottom",
    constraints: { minWidth: 12 },
  });
  toolWindows.register({
    id: editorDockToolWindowIds.quality,
    title: "QC",
    component: editorDockComponentIds.quality,
    preferredPlacement: "right-bottom",
    constraints: { minWidth: 12 },
  });
  toolWindows.register({
    id: editorDockToolWindowIds.playback,
    title: "Playback",
    component: editorDockComponentIds.playback,
    preferredPlacement: "bottom-right",
    constraints: { minHeight: 12 },
  });
  toolWindows.register({
    id: editorDockToolWindowIds.timeline,
    title: "Timeline",
    component: editorDockComponentIds.timeline,
    preferredPlacement: "bottom-left",
    constraints: { minHeight: 12 },
  });

  const store = new DockStateStore({ toolWindows });
  store.openWorkspaceItem({
    id: "subtitle-document",
    type: "subtitle-document",
    title: "Subtitles",
    component: editorDockComponentIds.subtitleDocument,
  });
  store.showToolWindow(editorDockToolWindowIds.outline);
  store.showToolWindow(editorDockToolWindowIds.tracks);
  store.showToolWindow(editorDockToolWindowIds.inspector);
  store.showToolWindow(editorDockToolWindowIds.quality);
  store.showToolWindow(editorDockToolWindowIds.playback);
  store.showToolWindow(editorDockToolWindowIds.timeline);

  return { components, store, toolWindows };
}
