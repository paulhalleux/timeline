import { describe, expect, test } from "bun:test";
import type {
  ActionDefinition,
  ActionInvocation,
  ActionRunResult,
} from "@ptl/action-core";
import { createActionHotkeyDefinitions } from "../src/hotkey-definitions";

interface TestContext {
  services?: Readonly<Record<string, unknown>>;
}

const globalAction: ActionDefinition<TestContext, string, void> = {
  id: "test.globalSave",
  title: "Global save",
  category: "File",
  keybindings: [{ keys: "Mod+S", preventDefault: true }],
  triggerFocus: { shortcut: "none" },
  run: () => "saved",
};

const surfaceAction: ActionDefinition<TestContext, string, void> = {
  id: "test.surfaceSave",
  title: "Surface save",
  category: "File",
  keybindings: [{ keys: "Mod+S", preventDefault: true }],
  triggerFocus: { shortcut: { surfaceId: "editor" } },
  run: () => "saved",
};

describe("createActionHotkeyDefinitions", () => {
  test("maps action keybindings to TanStack hotkey definitions", async () => {
    const invocations: ActionInvocation[] = [];
    const definitions = createActionHotkeyDefinitions({
      list: () => [globalAction],
      get: () => globalAction,
      run: async (_id, invocation): Promise<ActionRunResult> => {
        invocations.push(invocation);
        return { ok: true, actionId: globalAction.id, value: "saved" };
      },
    });

    expect(definitions).toHaveLength(1);
    expect(definitions[0]?.hotkey).toBe("Mod+S");

    const event = { target: { id: "button" } } as KeyboardEvent;
    definitions[0]?.callback(event, { hotkey: "Mod+S" });
    await Promise.resolve();

    expect(invocations).toEqual([
      {
        source: "shortcut",
        event,
        target: event.target,
      },
    ]);
  });

  test("separates global and surface hotkeys for duplicate keys", () => {
    const runner = {
      list: () => [globalAction, surfaceAction],
      get: (id: string) =>
        id === surfaceAction.id ? surfaceAction : globalAction,
      run: async (id: string) => ({ ok: true, actionId: id, value: "saved" }),
    };

    const globalDefinitions = createActionHotkeyDefinitions(runner, {
      focus: "global",
    });
    const surfaceDefinitions = createActionHotkeyDefinitions(runner, {
      focus: "surface",
      surfaceId: "editor",
    });

    expect(
      globalDefinitions.map((definition) => definition.options?.meta?.actionId),
    ).toEqual(["test.globalSave"]);
    expect(
      surfaceDefinitions.map((definition) => definition.options?.meta?.actionId),
    ).toEqual(["test.surfaceSave"]);
    expect(surfaceDefinitions[0]?.options?.stopPropagation).toBe(true);
  });
});
