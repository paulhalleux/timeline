# @ptl/flax-layout

Headless dockable layout state for IDE-style panel shells. The package owns no DOM,
CSS, pointer events, or framework bindings. It exposes immutable state, pure actions,
and a tiny subscription controller so React, Vue, Svelte, canvas, menu bars, or
command palettes can decide how panels look and how interactions are captured.

## Concepts

- **Panel definitions** describe stable panel IDs, labels, optional icon metadata,
  arbitrary `meta`, and constraints.
- **Tabsets** hold one or more panels, with an active panel.
- **Splits** arrange tabsets or other splits horizontally or vertically with weighted sizes.
- **Hidden panels** remain registered but are removed from the visible tree.
- **Toolbars** model left/right side bars as four page corners: `top-left`,
  `bottom-left`, `top-right`, and `bottom-right`.
- **Toolbar groups** keep items grouped; renderers can draw separators between groups.
- **Actions** hide, show, move, select, resize, register, unregister, and move toolbar
  items without assuming where state is stored.

## Example

```ts
import {
  FlaxLayoutController,
  createFlaxLayout,
  getToolbarPanelIds,
  getVisiblePanelIds,
} from "@ptl/flax-layout";

const layout = createFlaxLayout({
  panels: [
    { id: "project", title: "Project" },
    { id: "editor", title: "Editor", constraints: { canClose: false } },
    { id: "terminal", title: "Terminal", hidden: true },
  ],
  toolbars: {
    "top-left": [{ id: "workspace", panelIds: ["project"] }],
    "bottom-left": [{ id: "bottom", panelIds: ["terminal"] }],
    "top-right": [{ id: "primary", panelIds: ["editor"] }],
  },
});

const controller = new FlaxLayoutController(layout);

controller.subscribe((state) => {
  renderPanels(state.root, getVisiblePanelIds(state));
  renderActivityBars(state.toolbars, getToolbarPanelIds(state));
});

controller.dispatch({
  type: "showPanel",
  panelId: "terminal",
  location: { targetPanelId: "editor", placement: "bottom" },
});

controller.dispatch({
  type: "moveToolbarItem",
  panelId: "terminal",
  location: { corner: "bottom-right", groupId: "bottom", index: 0 },
});
```

## Constraints

Panel constraints are intentionally simple and renderer agnostic:

- `canClose: false` prevents hiding via close UI flows.
- `canMove: false` prevents drag/drop movement in both the panel tree and toolbars.
- `allowedDropPlacements` restricts whether a panel can dock left, right, top,
  bottom, or into the center of an existing tabset.
- `minSize` and `maxSize` clamp split resize weights.
