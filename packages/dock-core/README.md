# @ptl/dock-core

Generic, serializable dock layout state and workspace item type registries.

This package intentionally has no React, subtitle, or app-specific imports.

## Layout state

`createDockState()` creates a JSON-serializable model for docked tool windows,
workspace items, split sizes, floating items, and focus. Hosts can persist this
shape directly and render it with any UI layer.

```ts
import { addWorkspaceItem, createDockState } from "@ptl/dock-core";

const state = addWorkspaceItem(createDockState(), {
  id: "editor-1",
  type: "timed-text-editor",
  title: "Captions",
  component: "dock.editor.timed-text",
});
```

## Workspace item types

`WorkspaceItemTypeRegistry` stores the type-to-component contract for long-lived
workspace content. Inputs and metadata can be validated with Standard Schema
objects before an item is added to the layout state.

```ts
import { WorkspaceItemTypeRegistry } from "@ptl/dock-core";

const registry = new WorkspaceItemTypeRegistry();

registry.register({
  type: "timed-text-editor",
  title: "Timed text editor",
  component: "dock.editor.timed-text",
  createItem(input: { id: string }) {
    return {
      id: input.id,
      type: "timed-text-editor",
      title: "Captions",
      component: "dock.editor.timed-text",
    };
  },
});

const item = await registry.createItem("timed-text-editor", { id: "captions" });
```

## Tool windows and presets

Tool windows are contributed as metadata plus component IDs. Presets apply
workflow-specific layouts by dispatching reducer actions.

```ts
import {
  LayoutPresetRegistry,
  ToolWindowContributionRegistry,
  dockCommandIds,
} from "@ptl/dock-core";

const toolWindows = new ToolWindowContributionRegistry();
toolWindows.register({
  id: "outline",
  title: "Outline",
  component: "dock.tool.outline",
  preferredPlacement: "left-top",
});

const presets = new LayoutPresetRegistry();
presets.register({
  id: "review",
  title: "Review",
  apply: (builder) =>
    builder.dispatch({
      type: dockCommandIds.toolWindowShow,
      toolWindowId: "outline",
    }),
});
```

## Persistence

`serializeDockLayout()` separates user layout, project layout, session state,
and missing contribution state. `restoreDockLayout()` prunes unavailable
components from active state while preserving their serialized payloads for
future recovery.
