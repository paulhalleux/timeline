import { describe, expect, test } from "bun:test";

import type { EditorTimedTextDocument } from "../editor-model";
import { createEditorCue, deleteEditorCue, insertEditorCue, updateEditorCue } from "./transform";

describe("editor cue transforms", () => {
  test("creates cues with injected ids", () => {
    expect(createEditorCue({ startMs: 10, endMs: 20, text: "Hello" }, () => "cue-fixed")).toEqual({
      id: "cue-fixed",
      startMs: 10,
      endMs: 20,
      text: "Hello",
      speaker: undefined,
      tags: undefined,
      style: undefined,
      metadata: undefined,
    });
  });

  test("inserts, updates, and deletes cues without mutating input", () => {
    const document = fixtureDocument();
    const cue = createEditorCue({ id: "b", startMs: 1_000, endMs: 2_000 });
    const inserted = insertEditorCue(document, "track-1", cue, 1);

    expect(inserted.ok).toBe(true);
    if (!inserted.ok) return;
    expect(document.tracks[0].cues.map((item) => item.id)).toEqual(["a"]);
    expect(inserted.document.tracks[0].cues.map((item) => item.id)).toEqual(["a", "b"]);

    const updated = updateEditorCue(inserted.document, "b", { text: "Next" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.data.previousCue.text).toBe("");
    expect(updated.data.cue.text).toBe("Next");

    const deleted = deleteEditorCue(updated.document, "b");
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.data.index).toBe(1);
    expect(deleted.document.tracks[0].cues.map((item) => item.id)).toEqual(["a"]);
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
        cues: [{ id: "a", startMs: 0, endMs: 1_000, text: "A" }],
      },
    ],
  };
}
