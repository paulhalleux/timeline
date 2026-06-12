import { describe, expect, test } from "bun:test";

import type { EditorTimedTextDocument } from "../editor-model";
import {
  findOverlappingEditorCues,
  getEditorCueAt,
  getEditorCuesInRange,
  hasOverlappingEditorCues,
} from "./query";

describe("editor cue queries", () => {
  test("finds active and ranged cues across tracks", () => {
    const document = fixtureDocument();

    expect(getEditorCueAt(document, 750)?.id).toBe("a");
    expect(getEditorCuesInRange(document, 1_400, 2_600).map((cue) => cue.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("detects overlaps per track", () => {
    const document = fixtureDocument();

    expect(hasOverlappingEditorCues(document)).toBe(true);
    expect(findOverlappingEditorCues(document)).toHaveLength(1);
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
      {
        id: "track-2",
        kind: "subtitle",
        cues: [{ id: "c", startMs: 2_000, endMs: 3_000, text: "C" }],
      },
    ],
  };
}
