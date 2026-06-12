import { describe, expect, test } from "bun:test";
import type { ActionDescriptor } from "@ptl/action-core";
import { createActionContextMenuItems } from "../src/context-menu-items";

const contextAction: ActionDescriptor = {
  id: "edit.delete",
  title: "Delete",
  category: "Edit",
  presentation: { contextMenu: { group: "Edit", order: 10 } },
  triggerFocus: { contextMenu: "required", menu: "none" },
};

const menuAction: ActionDescriptor = {
  id: "file.export",
  title: "Export",
  category: "File",
  presentation: { menu: { path: ["File", "Export"], order: 20 } },
  triggerFocus: { contextMenu: "none", menu: "none" },
};

describe("createActionContextMenuItems", () => {
  test("includes context menu placements and menu-backed fallback actions", () => {
    const items = createActionContextMenuItems(
      {
        list: () => [contextAction, menuAction],
        get: (id) => (id === contextAction.id ? contextAction : menuAction),
        getState: () => ({ visible: true, enabled: true }),
        run: async (id) => ({ ok: true, actionId: id, value: undefined }),
      },
      { source: "contextMenu", target: { nodeType: 1 } },
    );

    expect(items.map((item) => item.action.id)).toEqual([
      "edit.delete",
      "file.export",
    ]);
  });
});
