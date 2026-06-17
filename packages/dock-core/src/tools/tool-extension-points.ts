import { createExtensionPoint } from "@ptl/platform-core";
import type { ToolDefinition } from "./tool-definition";
import type { WorkspaceEditorDefinition } from "../workspace/workspace-editor-definition";

export const dockTools = createExtensionPoint<ToolDefinition<unknown, unknown, unknown>>({
  id: "dock.tools",
  key: (tool) => tool.id,
  duplicates: "error",
});

export const dockWorkspaceEditors = createExtensionPoint<WorkspaceEditorDefinition<unknown, unknown, unknown>>({
  id: "dock.workspace-editors",
  key: (editor) => editor.id,
  duplicates: "error",
});
