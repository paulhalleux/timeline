import { createDockPlugin, createTool, createWorkspaceEditor, type ToolPanelProps } from "@ptl/dock-react";

const SimplePanel = ({ toolId }: ToolPanelProps) => (
  <div className="text-xs text-muted-foreground">{toolId} plugin panel</div>
);

export const subtitleWorkspaceEditor = createWorkspaceEditor({
  id: "subtitle-document",
  panel: () => <div className="text-xs">Subtitle document workspace</div>,
  getTitle: () => "Subtitles",
  allowMultiple: false,
});

export const createDockHostPlugin = () => createDockPlugin({ id: "dock" });
export const createShellPlugin = () => createDockPlugin({ id: "editor.shell", workspaceEditors: [subtitleWorkspaceEditor] });
export const createSubtitleDocumentPlugin = () => createDockPlugin({ id: "editor.subtitle-document" });
export const createOutlinePlugin = () => createDockPlugin({ id: "editor.outline", tools: [createTool({ id: "outline", title: "Outline", panel: SimplePanel, preferredPlacement: "left-top" })] });
export const createTracksPlugin = () => createDockPlugin({ id: "editor.tracks", tools: [createTool({ id: "tracks", title: "Tracks", panel: SimplePanel, preferredPlacement: "left-bottom" })] });
export const createInspectorPlugin = () => createDockPlugin({ id: "editor.inspector", tools: [createTool({ id: "inspector", title: "Inspector", panel: SimplePanel, preferredPlacement: "right-top" })] });
export const createQualityControlPlugin = () => createDockPlugin({ id: "editor.quality-control", tools: [createTool({ id: "quality-control", title: "Quality Control", panel: SimplePanel, preferredPlacement: "right-bottom" })] });
export const createPlaybackPlugin = () => createDockPlugin({ id: "editor.playback", tools: [createTool({ id: "playback", title: "Playback", panel: SimplePanel, preferredPlacement: "bottom-right" })] });
export const createTimelinePlugin = () => createDockPlugin({ id: "editor.timeline", tools: [createTool({ id: "timeline", title: "Timeline", panel: SimplePanel, preferredPlacement: "bottom-left", constraints: { canHide: true, canMove: true, minHeight: 160 } })] });
