import { describe, expect, test } from "bun:test";

import {
  FlexLayoutController,
  applyFlexLayoutAction,
  createFlexLayout,
  createSplit,
  createTabset,
  findPanelTabset,
  getToolbarPanelIds,
  getVisiblePanelIds,
  getVisibleToolbarPanelIds,
  type FlexLayoutState,
} from "./index";

describe("flex layout", () => {
  test("creates a headless tabset from visible panels", () => {
    const state = fixtureLayout();

    expect(getVisiblePanelIds(state)).toEqual(["project", "editor", "terminal"]);
    expect(state.hiddenPanelIds).toEqual(["problems"]);
  });

  test("hides and shows panels without rendering assumptions", () => {
    const hidden = applyFlexLayoutAction(fixtureLayout(), {
      type: "hidePanel",
      panelId: "terminal",
    });

    expect(hidden.accepted).toBe(true);
    if (!hidden.accepted) return;
    expect(getVisiblePanelIds(hidden.state)).toEqual(["project", "editor"]);
    expect(hidden.state.hiddenPanelIds).toContain("terminal");

    const shown = applyFlexLayoutAction(hidden.state, {
      type: "showPanel",
      panelId: "terminal",
      location: { targetPanelId: "project", placement: "right" },
    });

    expect(shown.accepted).toBe(true);
    if (!shown.accepted) return;
    expect(getVisiblePanelIds(shown.state)).toEqual(["project", "editor", "terminal"]);
    expect(shown.state.hiddenPanelIds).not.toContain("terminal");
    expect(shown.state.root?.type).toBe("split");
  });

  test("moves panels into tabsets or directional splits", () => {
    const movedToTabs = applyFlexLayoutAction(fixtureLayout(), {
      type: "movePanel",
      panelId: "terminal",
      location: { targetPanelId: "project", placement: "center" },
    });

    expect(movedToTabs.accepted).toBe(true);
    if (!movedToTabs.accepted) return;
    expect(findPanelTabset(movedToTabs.state.root, "project")?.panels).toEqual([
      "project",
      "terminal",
      "editor",
    ]);

    const movedToSplit = applyFlexLayoutAction(movedToTabs.state, {
      type: "movePanel",
      panelId: "terminal",
      location: { targetPanelId: "editor", placement: "bottom" },
    });

    expect(movedToSplit.accepted).toBe(true);
    if (!movedToSplit.accepted) return;
    expect(movedToSplit.state.root?.type).toBe("split");
  });

  test("rejects constrained panel operations", () => {
    const hidden = applyFlexLayoutAction(fixtureLayout(), {
      type: "hidePanel",
      panelId: "editor",
    });
    expect(hidden).toEqual({
      accepted: false,
      reason: "Panel cannot be hidden: editor",
    });

    const moved = applyFlexLayoutAction(fixtureLayout(), {
      type: "movePanel",
      panelId: "project",
      location: { targetPanelId: "editor", placement: "bottom" },
    });
    expect(moved).toEqual({
      accepted: false,
      reason: "Drop placement is not allowed: bottom",
    });
  });

  test("resizes split children while applying panel size constraints", () => {
    const state = createFlexLayout({
      panels: [
        { id: "left", constraints: { minSize: 0.25 } },
        { id: "right", constraints: { maxSize: 0.6 } },
      ],
      root: createSplit(
        "horizontal",
        [
          { node: createTabset(["left"], "left-tabs"), size: 0.5 },
          { node: createTabset(["right"], "right-tabs"), size: 0.5 },
        ],
        "main-split",
      ),
    });

    const resized = applyFlexLayoutAction(state, {
      type: "resizeSplit",
      splitId: "main-split",
      sizes: [0.1, 0.9],
    });

    expect(resized.accepted).toBe(true);
    if (!resized.accepted || resized.state.root?.type !== "split") return;
    expect(resized.state.root.children.map((child) => child.size)).toEqual([
      0.25, 0.6,
    ]);
  });


  test("creates grouped side toolbar state with separators between groups", () => {
    const state = createFlexLayout({
      panels: [
        { id: "project" },
        { id: "search" },
        { id: "terminal" },
        { id: "problems", hidden: true },
      ],
      toolbars: {
        "top-left": [{ id: "workspace", panelIds: ["project", "search"] }],
        "bottom-left": [{ id: "bottom", panelIds: ["terminal", "problems"] }],
      },
    });

    expect(state.toolbars["top-left"]).toEqual([
      { id: "workspace", panelIds: ["project", "search"] },
    ]);
    expect(state.toolbars["bottom-left"]).toEqual([
      { id: "bottom", panelIds: ["terminal", "problems"] },
    ]);
    expect(getToolbarPanelIds(state)).toEqual([
      "project",
      "search",
      "terminal",
      "problems",
    ]);
    expect(getVisibleToolbarPanelIds(state, "bottom-left")).toEqual(["terminal"]);
  });

  test("moves toolbar items between the four page corners", () => {
    const state = fixtureLayout();
    const moved = applyFlexLayoutAction(state, {
      type: "moveToolbarItem",
      panelId: "terminal",
      location: { corner: "bottom-right", groupId: "tools", index: 0 },
    });

    expect(moved.accepted).toBe(true);
    if (!moved.accepted) return;
    expect(moved.state.toolbars["bottom-right"]).toEqual([
      { id: "tools", panelIds: ["terminal"] },
    ]);
    expect(getToolbarPanelIds(moved.state, "top-left")).toEqual([
      "project",
      "editor",
      "problems",
    ]);
  });

  test("controller exposes a small subscription based integration surface", () => {
    const controller = new FlexLayoutController(fixtureLayout());
    const snapshots: string[][] = [];

    const unsubscribe = controller.subscribe((state) => {
      snapshots.push([...getVisiblePanelIds(state)]);
    });
    controller.dispatch({ type: "hidePanel", panelId: "terminal" });
    unsubscribe();
    controller.dispatch({ type: "hidePanel", panelId: "project" });

    expect(snapshots).toEqual([
      ["project", "editor", "terminal"],
      ["project", "editor"],
    ]);
  });
});

function fixtureLayout(): FlexLayoutState {
  return createFlexLayout({
    panels: [
      {
        id: "project",
        constraints: { allowedDropPlacements: ["left", "right", "center"] },
      },
      { id: "editor", constraints: { canClose: false } },
      { id: "terminal" },
      { id: "problems", hidden: true },
    ],
  });
}
