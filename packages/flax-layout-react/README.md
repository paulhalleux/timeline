# @ptl/flax-layout-react

React primitives for `@ptl/flax-layout`. The components follow the same
compound-component style used by headless UI libraries: they render accessible
building blocks, expose data attributes for styling, and keep layout state in the
core package instead of coupling it to a theme.

## What is included

- `FlaxLayout.Root` creates a controlled or uncontrolled layout provider. Pass
  `state` and `onStateChange` to externalize state for menubars, command palettes,
  persisted workspace settings, or collaboration layers.
- `FlaxLayout.Tree` renders the current split/tabset tree.
- `FlaxLayout.Split` and `FlaxLayout.ResizeHandle` implement pointer-based split resizing.
- `FlaxLayout.Tabset`, `FlaxLayout.TabList`, and `FlaxLayout.Tab` implement tab
  selection and native drag/drop docking.
- `FlaxLayout.Panel` renders the active panel through your `renderPanel` callback;
  panel contents can be any React node or component tree.
- `FlaxLayout.ToolbarSide`, `ToolbarCorner`, `ToolbarGroup`, `ToolbarItem`, and
  `ToolbarSeparator` render left/right side toolbars backed by four page corners.
- Toolbar items can be grouped, separated, dragged between all four page corners,
  right-clicked for a hide / move-to menu, and selected to activate their panel.
- `FlaxLayout.ToolbarOverflow` renders a built-in `…` trigger that re-adds hidden
  panels.
- `FlaxLayout.CloseTrigger` and `FlaxLayout.HiddenPanels` are available when you
  want panel-local close buttons or a custom hidden-panel list.

## Example

```tsx
import { FlaxLayout } from "@ptl/flax-layout-react";

export function IdeShell() {
  return (
    <FlaxLayout.Root
      options={{
        panels: [
          { id: "project", title: "Project" },
          { id: "editor", title: "Editor", constraints: { canClose: false } },
          { id: "terminal", title: "Terminal", hidden: true },
        ],
        toolbars: {
          "top-left": [{ id: "workspace", panelIds: ["project"] }],
          "bottom-left": [{ id: "bottom", panelIds: ["terminal"] }],
          "top-right": [{ id: "editor", panelIds: ["editor"] }],
        },
      }}
      renderPanel={({ panel }) => <PanelContent panelId={panel.id} />}
      renderToolbarItem={({ panel }) => <span>{panel.title ?? panel.id}</span>}
    />
  );
}
```

By default, `Root` renders a left toolbar, the layout tree, and a right toolbar.
You can fully compose the shell yourself:

```tsx
<FlaxLayout.Root state={state} onStateChange={setState} renderPanel={renderPanel}>
  <FlaxLayout.ToolbarSide side="left" />
  <FlaxLayout.Tree className="ide-layout" />
  <FlaxLayout.ToolbarSide side="right" />
</FlaxLayout.Root>
```

Drag a tab over the center of another tabset to merge it into that tabset. Drag
near the left, right, top, or bottom edge of a tabset to dock it into a new split.
Drag toolbar items between `top-left`, `bottom-left`, `top-right`, and
`bottom-right` to rearrange side toolbar shortcuts. Resize handles are inserted
between split children automatically.

## Styling

The primitives are intentionally unstyled. Target the emitted data attributes:

```css
[data-flax-layout-root] {
  height: 100%;
}

[data-flax-layout-toolbar-side][data-side="left"] {
  border-right: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}

[data-flax-layout-toolbar-item][data-active] {
  font-weight: 600;
}

[data-flax-layout-resize-handle][data-orientation="horizontal"] {
  width: 4px;
}
```
