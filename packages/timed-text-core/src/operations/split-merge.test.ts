import { describe, expect, test } from "bun:test";

import type { EditorTimedTextDocument } from "../editor-model";
import { mergeEditorCues } from "./merge";
import { splitEditorCue } from "./split";

describe("editor split and merge operations", () => {
  test("splits a cue with injected second cue id", () => {
    const result = splitEditorCue(fixtureDocument(), "a", 1_000, {
      createId: () => "a-2",
      textDistribution: "split",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.firstCue).toMatchObject({
      id: "a",
      endMs: 1_000,
      text: "Hello",
    });
    expect(result.data.secondCue).toMatchObject({
      id: "a-2",
      startMs: 1_000,
      text: "world",
    });
  });

  test("merges cues in track order", () => {
    const result = mergeEditorCues(fixtureDocument(), ["b", "a"], {
      separator: " ",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.mergedCue).toMatchObject({
      id: "a",
      startMs: 0,
      endMs: 3_000,
      text: "Hello world Second",
    });
    expect(result.document.tracks[0].cues.map((cue) => cue.id)).toEqual(["a"]);
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
          { id: "a", startMs: 0, endMs: 2_000, text: "Hello world" },
          { id: "b", startMs: 2_000, endMs: 3_000, text: "Second" },
        ],
      },
    ],
  };
}
