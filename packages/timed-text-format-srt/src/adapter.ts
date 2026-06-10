import {
  type ConversionWarning,
  createEditorDocument,
  type EditorTimedTextDocument,
  generateId,
  type TimedTextAdapter,
} from "@ptl/timed-text-core";

import { parseSrt } from "./parser";
import { serializeSrt } from "./serializer";
import type { SrtCue, SrtDocument } from "./types";
import { validateSrt } from "./validation";

export const srtAdapter: TimedTextAdapter<SrtDocument, SrtCue> = {
  format: "srt",
  label: "SubRip",
  extensions: ["srt"],
  parse(input) {
    return parseSrt(input.content);
  },
  serialize(document, options) {
    return serializeSrt(document, options);
  },
  getCues(document) {
    return document.cues;
  },
  updateCue(document, cueId, cue) {
    return {
      ...document,
      cues: document.cues.map((candidate) =>
        candidate.id === cueId ? cue : candidate,
      ),
    };
  },
  toEditor(document) {
    return {
      document: createEditorDocument({
        id: "srt-document",
        format: "srt",
        tracks: [
          {
            id: "srt-main",
            kind: "subtitle",
            cues: document.cues.map((cue) => ({
              id: cue.id,
              startMs: cue.startMs,
              endMs: cue.endMs,
              text: cue.lines.join("\n"),
              metadata: { index: cue.index },
            })),
          },
        ],
        metadata: document.metadata,
      }),
      issues: [],
    };
  },
  fromEditor(document: EditorTimedTextDocument) {
    const issues: ConversionWarning[] = [];
    const cues = document.tracks.flatMap((track) => track.cues);

    for (const cue of cues) {
      if (cue.style || cue.tags || cue.speaker) {
        issues.push({
          id: `srt_lossy_${cue.id}`,
          severity: "warning",
          code: "srt.lossy-editor-feature",
          message:
            "SRT export keeps timing and text but discards editor styling, speaker, and tag metadata.",
          cueId: cue.id,
        });
      }
    }

    return {
      document: {
        type: "srt",
        metadata: document.metadata,
        cues: cues.map((cue, index) => ({
          id: generateId("srt"),
          index: index ?? 1,
          startMs: cue.startMs,
          endMs: cue.endMs,
          lines: (cue.text ?? "").split("\n"),
        })),
      },
      issues,
    };
  },
  validate(document) {
    return validateSrt(document);
  },
};
