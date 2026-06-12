import { describe, expect, test } from "bun:test";
import { createActionRegistry } from "./registry";
import type { ActionDefinition } from "./definition";

interface TestServices {
  calls: string[];
}

const saveAction: ActionDefinition<TestServices> = {
  descriptor: {
    id: "editor.file.save",
    title: "Save",
    shortcuts: ["Mod+S"],
    placement: [{ menu: "file", palette: true }],
  },
  run: ({ services }) => {
    services.calls.push("save");
  },
};

describe("action registry", () => {
  test("registers and lists generic action definitions", () => {
    const registry = createActionRegistry<TestServices>([saveAction]);

    expect(registry.get("editor.file.save")).toBe(saveAction);
    expect(registry.descriptors()).toEqual([saveAction.descriptor]);
  });

  test("rejects duplicate ids", () => {
    expect(() => createActionRegistry<TestServices>([saveAction, saveAction])).toThrow(
      "Duplicate action id",
    );
  });
});
