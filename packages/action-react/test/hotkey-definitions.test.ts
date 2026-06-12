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

const action: ActionDefinition<TestContext, string, void> = {
  id: "test.save",
  title: "Save",
  category: "File",
  keybindings: [{ keys: "Mod+S", preventDefault: true }],
  run: () => "saved",
};

describe("createActionHotkeyDefinitions", () => {
  test("maps action keybindings to TanStack hotkey definitions", async () => {
    const invocations: ActionInvocation[] = [];
    const definitions = createActionHotkeyDefinitions({
      list: () => [action],
      get: () => action,
      run: async (_id, invocation): Promise<ActionRunResult> => {
        invocations.push(invocation);
        return { ok: true, actionId: action.id, value: "saved" };
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
        scopeElementId: undefined,
      },
    ]);
  });
});
