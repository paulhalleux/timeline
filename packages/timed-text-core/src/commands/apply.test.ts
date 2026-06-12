import { describe, expect, test } from "bun:test";

import type { EditorTimedTextDocument } from "../editor-model";
import { createEditorCue } from "../operations";
import { applyEditorCommand } from "./apply";
import { deleteCueCommand } from "./handlers/delete-cue";
import { insertCueCommand } from "./handlers/insert-cue";
import { updateCueTextCommand } from "./handlers/update-cue-text";

describe("editor commands", () => {
  test("applies insert commands and returns an undo command", () => {
    const cue = createEditorCue({ id: "b", startMs: 1_000, endMs: 2_000 });
    const command = insertCueCommand({ trackId: "track-1", cue });
    const result = applyEditorCommand(fixtureDocument(), command);

    expect(result.ok).toBe(true);
    expect(result.document.tracks[0].cues.map((item) => item.id)).toEqual(["a", "b"]);
    expect(JSON.parse(JSON.stringify(result.undoCommand))).toEqual({
      type: "cue/delete",
      payload: { cueId: "b" },
    });

    expect(result.undoCommand).toBeDefined();
    if (!result.undoCommand) return;

    const undone = result.undoCommand.do(result.document);
    expect(undone.ok).toBe(true);
    expect(undone.document.tracks[0].cues.map((item) => item.id)).toEqual(["a"]);
  });

  test("undoes text updates through the returned undo command", () => {
    const command = updateCueTextCommand("a", "Changed");
    const result = command.do(fixtureDocument());

    expect(result.ok).toBe(true);
    expect(result.undoCommand).toBeDefined();

    if (!result.undoCommand) return;

    const undone = result.undoCommand.do(result.document);
    expect(undone.ok).toBe(true);
    expect(undone.document.tracks[0].cues[0].text).toBe("Original");
  });

  test("reports rich failures without mutating the document", () => {
    const document = fixtureDocument();
    const result = deleteCueCommand("missing").do(document);

    expect(result.ok).toBe(false);
    expect(result.document).toBe(document);
    expect(result.errors[0].code).toBe("cue.not-found");
  });
});

function fixtureDocument(): EditorTimedTextDocument {
  return {
    id: "doc",
    format: "vtt",
    tracks: [
      {
        id: "track-1",
        kind: "subtitle",
        cues: [{ id: "a", startMs: 0, endMs: 1_000, text: "Original" }],
      },
    ],
  };
}
