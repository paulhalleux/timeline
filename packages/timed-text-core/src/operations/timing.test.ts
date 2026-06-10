import { describe, expect, test } from "bun:test";

import type { EditorTimedTextDocument } from "../editor-model";
import {
  fixEditorOverlaps,
  shiftEditorCues,
  updateEditorCueTiming,
} from "./timing";

describe("editor timing operations", () => {
  test("validates cue timing updates", () => {
    const result = updateEditorCueTiming(fixtureDocument(), "a", 2_000, 500);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe("cue.invalid-timing");
  });

  test("shifts selected cues", () => {
    const shifted = shiftEditorCues(fixtureDocument(), 250, ["b"]);

    expect(shifted.tracks[0].cues.map((cue) => cue.startMs)).toEqual([
      0, 1_250,
    ]);
  });

  test("fixes overlaps per track", () => {
    const fixed = fixEditorOverlaps(fixtureDocument());

    expect(fixed.tracks[0].cues[1].startMs).toBe(1_500);
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
        cues: [
          { id: "a", startMs: 0, endMs: 1_500, text: "A" },
          { id: "b", startMs: 1_000, endMs: 2_000, text: "B" },
        ],
      },
    ],
  };
}
