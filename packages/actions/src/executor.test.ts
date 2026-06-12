import { describe, expect, test } from "bun:test";
import type { ActionDefinition } from "./definition";
import { executeAction, runAction } from "./executor";
import { createActionRegistry } from "./registry";

interface TestServices {
  calls: string[];
}

describe("action executor", () => {
  test("runs enabled actions from any trigger source", async () => {
    const services: TestServices = { calls: [] };
    const action: ActionDefinition<TestServices> = {
      descriptor: { id: "editor.panel.toggle", title: "Toggle Panel" },
      run: ({ services }) => {
        services.calls.push("toggle");
      },
    };

    const result = await runAction(action, { source: "button", services });

    expect(result).toEqual({ ok: true, actionId: "editor.panel.toggle" });
    expect(services.calls).toEqual(["toggle"]);
  });

  test("does not run disabled actions", async () => {
    const services: TestServices = { calls: [] };
    const action: ActionDefinition<TestServices> = {
      descriptor: { id: "editor.file.save", title: "Save" },
      getState: () => ({ visible: true, enabled: false, reason: "No document is open." }),
      run: ({ services }) => {
        services.calls.push("save");
      },
    };

    const result = await runAction(action, { source: "shortcut", services });

    expect(result).toEqual({
      ok: false,
      actionId: "editor.file.save",
      error: {
        code: "action.disabled",
        message: "No document is open.",
        actionId: "editor.file.save",
      },
    });
    expect(services.calls).toEqual([]);
  });

  test("reports missing registered actions", async () => {
    const registry = createActionRegistry<TestServices>();

    const result = await executeAction(registry, "missing", {
      source: "command-palette",
      services: { calls: [] },
    });

    expect(result).toEqual({
      ok: false,
      actionId: "missing",
      error: {
        code: "action.not-found",
        message: "Action is not registered.",
        actionId: "missing",
      },
    });
  });
});
