# @ptl/dock-core

`@ptl/dock-core` owns renderer-agnostic dock layout types plus plugin-first extension points for dock tools and workspace editors. Runtime tool/editor definitions can contain panel values, while persisted layout state remains serializable and stores only IDs, placement, visibility, size, and local state.

## Direct-panel tools

```ts
import { createTool, dockTools } from "@ptl/dock-core";
import { createPlugin } from "@ptl/platform-core";

const timelineTool = createTool({
  id: "timeline",
  title: "Timeline",
  panel: TimelinePanel,
  preferredPlacement: "bottom-left",
  constraints: { canHide: true, canMove: true, minHeight: 160 },
});

export const createTimelinePlugin = () => createPlugin({
  id: "editor.timeline",
  requires: [dockTools],
  contributions: [dockTools.contribute(timelineTool)],
});
```

## Workspace editors

```ts
import { createWorkspaceEditor, dockWorkspaceEditors } from "@ptl/dock-core";

const subtitleEditor = createWorkspaceEditor({
  id: "subtitle-document",
  panel: SubtitleDocumentPanel,
  getTitle: () => "Subtitles",
  allowMultiple: false,
});
```

## Serializable instance state

`ToolDefinition` and `WorkspaceEditorDefinition` are runtime definitions. `ToolInstanceState` and `WorkspaceEditorInstanceState` are persisted state shapes and never contain components.

## Layout state and persistence

`createDockState()` creates the serializable dock layout model. `serializeDockLayout()` and `restoreDockLayout()` preserve layout, project, and session state and tolerate missing runtime definitions when plugins are not installed.
