import { describe, expect, test } from "bun:test";

import {
  ActionScope,
  createTypedActionRegistry,
  type ActionDefinition,
} from "../src";

interface TestContext {
  value: number;
}

describe("action scopes", () => {
  test("requires registered action surfaces for focused-surface triggers", async () => {
    const context: TestContext = { value: 1 };
    const action: ActionDefinition<TestContext, number, { delta: number }> = {
      id: "test.increment",
      title: "Increment",
      category: "Test",
      triggerFocus: { shortcut: "required", menu: "none" },
      run(ctx, invocation) {
        return ctx.value + (invocation.payload?.delta ?? 0);
      },
    };
    const scope = new ActionScope({
      id: "test",
      getContext: () => context,
      actions: [action],
    });

    const withoutSurface = await scope.runAction(action, {
      source: "shortcut",
      payload: { delta: 2 },
    });
    expect(withoutSurface.ok).toBe(false);
    expect(withoutSurface.reason).toBe("surface-unavailable");

    scope.registerSurface({ id: "editor" });
    const withSurface = await scope.runAction(action, {
      source: "shortcut",
      surfaceId: "editor",
      payload: { delta: 2 },
    });
    expect(withSurface).toEqual({ ok: true, actionId: action.id, value: 3 });

    const menu = await scope.runAction(action, {
      source: "menu",
      payload: { delta: 3 },
    });
    expect(menu).toEqual({ ok: true, actionId: action.id, value: 4 });
  });

  test("typed registry invokes actions by autocomplete-friendly keys", async () => {
    const context: TestContext = { value: 4 };
    const multiply: ActionDefinition<TestContext, number, { by: number }> = {
      id: "test.multiply",
      title: "Multiply",
      category: "Test",
      run(ctx, invocation) {
        return ctx.value * (invocation.payload?.by ?? 1);
      },
    };
    const registry = createTypedActionRegistry({
      getContext: () => context,
      actions: { multiply },
    });

    const result = await registry.run("multiply", {
      source: "api",
      payload: { by: 3 },
    });

    expect(result).toEqual({ ok: true, actionId: multiply.id, value: 12 });
  });
});
