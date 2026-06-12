import { describe, expect, test } from "bun:test";
import type { ActionDefinition } from "./definition";
import { createShortcutMap, normalizeShortcut } from "./shortcut";

describe("shortcuts", () => {
  test("normalizes shortcut strings for lookup", () => {
    expect(normalizeShortcut(" Mod + Shift + P ")).toBe("mod+shift+p");
  });

  test("maps shortcuts to action ids", () => {
    const actions: ActionDefinition[] = [
      {
        descriptor: { id: "editor.file.save", title: "Save", shortcuts: ["Mod+S"] },
        run: () => undefined,
      },
    ];

    expect(createShortcutMap(actions).get("mod+s")).toBe("editor.file.save");
  });

  test("rejects conflicting shortcuts", () => {
    const actions: ActionDefinition[] = [
      {
        descriptor: { id: "editor.file.save", title: "Save", shortcuts: ["Mod+S"] },
        run: () => undefined,
      },
      {
        descriptor: { id: "editor.file.save-as", title: "Save As", shortcuts: ["mod + s"] },
        run: () => undefined,
      },
    ];

    expect(() => createShortcutMap(actions)).toThrow("Shortcut mod + s is already used");
  });
});
