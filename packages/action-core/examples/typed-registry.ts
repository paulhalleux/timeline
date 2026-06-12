import {
  createTypedActionRegistry,
  type ActionDefinition,
} from "../src";

interface EditorContext {
  currentCueId(): string | undefined;
  deleteCue(cueId: string): void;
}

const deleteCue: ActionDefinition<EditorContext, void, { cueId: string }> = {
  id: "editor.deleteCue",
  title: "Delete cue",
  category: "Edit",
  triggerFocus: {
    shortcut: "required",
    menu: "none",
  },
  run(context, invocation) {
    context.deleteCue(invocation.payload?.cueId ?? "");
  },
};

const registry = createTypedActionRegistry({
  getContext: (): EditorContext => ({
    currentCueId: () => "cue-1",
    deleteCue: () => undefined,
  }),
  actions: { deleteCue },
});

registry.registerSurface({ id: "editor-pane" });

await registry.run("deleteCue", {
  source: "shortcut",
  surfaceId: "editor-pane",
  payload: { cueId: "cue-1" },
});
