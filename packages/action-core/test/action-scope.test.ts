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
  test("requires registered scope elements for scoped triggers", async () => {
    const context: TestContext = { value: 1 };
    const action: ActionDefinition<TestContext, number, { delta: number }> = {
      id: "test.increment",
      title: "Increment",
      category: "Test",
      triggerScopes: { shortcut: "required", menu: "none" },
      run(ctx, invocation) {
        return ctx.value + (invocation.payload?.delta ?? 0);
      },
    };
    const scope = new ActionScope({
      id: "test",
      getContext: () => context,
      actions: [action],
    });

    const withoutScope = await scope.runAction(action, {
      source: "shortcut",
      payload: { delta: 2 },
    });
    expect(withoutScope.ok).toBe(false);
    expect(withoutScope.reason).toBe("scope-unavailable");

    scope.registerElement({ id: "editor" });
    const withScope = await scope.runAction(action, {
      source: "shortcut",
      scopeElementId: "editor",
      payload: { delta: 2 },
    });
    expect(withScope).toEqual({ ok: true, actionId: action.id, value: 3 });

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
