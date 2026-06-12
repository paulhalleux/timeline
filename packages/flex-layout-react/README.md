# @ptl/flex-layout-react

React primitives for `@ptl/flex-layout`. The package is intentionally headless:
it owns interaction wiring (selection, resize, drag/drop, context menus and
hidden-item overflow), while your app owns markup details, icons, styling and
persistence.

The API is inspired by JetBrains-style flexible side toolbars, but it is not an
IDE shell and does not require your product to expose a tree. Internally the core
package stores the docked panel area as split/tabset state because that makes
resize and drop behavior deterministic; the React package exposes that area as a
`Workspace` primitive instead of asking application code to deal with a tree.

## What is included

- `FlexLayout.Root` creates a controlled or uncontrolled layout provider. Pass
  `state` and `onStateChange` to externalize state for menubars, command palettes,
  persisted workspace settings, or collaboration layers.
- `FlexLayout.Workspace` renders the current docked panel area.
- `FlexLayout.Split` and `FlexLayout.ResizeHandle` implement pointer-based split
  resizing for the workspace.
- `FlexLayout.Tabset`, `FlexLayout.TabList`, and `FlexLayout.Tab` implement tab
  selection and native drag/drop docking.
- `FlexLayout.Panel` renders the active panel with a composition renderer; panel
  contents can be any React node or component tree.
- `FlexLayout.ToolbarSide`, `ToolbarCorner`, `ToolbarGroup`, `ToolbarItem`, and
  `ToolbarSeparator` render left/right side toolbars backed by four page corners.
- Toolbar items can be grouped, separated, dragged between all four page corners,
  right-clicked for a hide / move-to menu, and selected to activate their panel.
- `FlexLayout.ToolbarOverflow` renders a built-in `…` trigger that re-adds hidden
  panels.
- `FlexLayout.CloseTrigger` and `FlexLayout.HiddenPanels` are available when you
  want panel-local close buttons or a custom hidden-panel list.
- `FlexRender.Panel`, `FlexRender.Item`, and `FlexRender.HiddenItem` register
  renderers through JSX composition.

## Composition-first rendering

Prefer render-slot components over `renderXXX` props:

```tsx
import { FlexLayout, FlexRender } from "@ptl/flex-layout-react";

export function WorkspaceShell() {
  return (
    <FlexLayout.Root
      options={{
        panels: [
          { id: "assets", title: "Assets" },
          { id: "preview", title: "Preview", constraints: { canClose: false } },
          { id: "inspector", title: "Inspector", hidden: true },
        ],
        toolbars: {
          "top-left": [{ id: "main", panelIds: ["assets", "preview"] }],
          "bottom-right": [{ id: "details", panelIds: ["inspector"] }],
        },
      }}
    >
      <FlexRender.Item>
        {({ panel, active }) => (
          <span aria-current={active ? "page" : undefined}>
            {panel.title ?? panel.id}
          </span>
        )}
      </FlexRender.Item>

      <FlexRender.Panel>
        {({ panel, hide }) => (
          <section>
            <header>
              <strong>{panel.title ?? panel.id}</strong>
              <button type="button" onClick={hide}>
                Hide
              </button>
            </header>
            <PanelContent panelId={panel.id} />
          </section>
        )}
      </FlexRender.Panel>

      <FlexRender.HiddenItem>
        {({ panel, show }) => (
          <button type="button" role="menuitem" onClick={show}>
            Restore {panel.title ?? panel.id}
          </button>
        )}
      </FlexRender.HiddenItem>

      <FlexLayout.ToolbarSide side="left" />
      <FlexLayout.Workspace className="workspace" />
      <FlexLayout.ToolbarSide side="right" />
    </FlexLayout.Root>
  );
}
```

The render-slot components return `null`; they register functions in context for
primitive components to call later. This keeps the rendering API composable while
still allowing the toolbar and workspace primitives to own drag/drop and resize
behavior.

`renderPanel`, `renderToolbarItem`, and `renderHiddenPanel` remain available as
deprecated compatibility props for older code, but new code should use
`FlexRender`.

## Controlled state

Use controlled state when menus, commands, hotkeys, persistence, or multiplayer
sessions need to inspect or change the layout:

```tsx
const [state, setState] = React.useState(() => createFlexLayout(options));

return (
  <FlexLayout.Root state={state} onStateChange={setState}>
    <FlexRender.Panel>{({ panel }) => <PanelContent panelId={panel.id} />}</FlexRender.Panel>
    <FlexLayout.ToolbarSide side="left" />
    <FlexLayout.Workspace />
    <FlexLayout.ToolbarSide side="right" />
  </FlexLayout.Root>
);
```

Because state is plain JSON-compatible data, the same state object can drive a
menubar, command palette, keyboard shortcuts, or a settings screen. Dispatch core
actions with `useFlexLayout()` from any descendant.

## Persistence strategies

Pick storage based on how personal or shareable the layout should be:

1. **Local, per browser:** serialize `FlexLayoutState` to `localStorage` or
   IndexedDB from `onStateChange`; hydrate it into `state`/`defaultState` after
   validating that panel IDs still exist.
2. **Per authenticated user:** store the JSON state in a user preferences table
   keyed by workspace/project ID. Merge with current panel definitions on load so
   newly shipped panels can be registered and removed panels can be ignored.
3. **Per project/workspace:** store state alongside project settings when layout
   should travel with a repository or shared workspace.
4. **URL/session share:** persist only a compact subset (active panel, hidden
   panels, toolbar corners) in query params; keep full split sizes in local or
   server storage.
5. **Versioned migrations:** wrap saved state in `{ version, state }`. When panel
   IDs or default groups change, migrate older versions before passing state to
   `FlexLayout.Root`.

A typical safe loader is:

```ts
const STORAGE_KEY = "flex-layout:v1";

function saveLayout(state: FlexLayoutState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state }));
}

function loadLayout(options: FlexLayoutOptions) {
  const fallback = createFlexLayout(options);
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;

  const parsed = JSON.parse(raw) as { version: number; state: FlexLayoutState };
  if (parsed.version !== 1) return fallback;

  // Keep current panel definitions authoritative; persisted state only restores
  // arrangement, hidden IDs and toolbar locations.
  return {
    ...parsed.state,
    panels: fallback.panels,
  } satisfies FlexLayoutState;
}
```

## Drag/drop behavior

Drag a tab over the center of another tabset to merge it into that tabset. Drag
near the left, right, top, or bottom edge of a tabset to dock it into a new split.
Drag toolbar items between `top-left`, `bottom-left`, `top-right`, and
`bottom-right` to rearrange side toolbar shortcuts. Resize handles are inserted
between split children automatically.

## Styling

The primitives are intentionally unstyled. Target the emitted data attributes:

```css
[data-flex-layout-root] {
  height: 100%;
}

[data-flex-layout-toolbar-side][data-side="left"] {
  border-right: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}

[data-flex-layout-toolbar-item][data-active] {
  font-weight: 600;
}

[data-flex-layout-resize-handle][data-orientation="horizontal"] {
  width: 4px;
}
```
