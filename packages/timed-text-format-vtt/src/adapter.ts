import {
  contentToPlainText,
  type ConversionWarning,
  createEditorDocument,
  type EditorTimedTextDocument,
  type TimedTextAdapter,
} from "@ptl/timed-text-core";

import { parseVtt } from "./parser";
import { serializeVtt } from "./serializer";
import { parseStyledText } from "./text-parser";
import type { VttCue, VttDocument } from "./types";
import { validateVtt } from "./validation";

export const vttAdapter: TimedTextAdapter<VttDocument, VttCue> = {
  format: "vtt",
  label: "WebVTT",
  extensions: ["vtt", "webvtt"],
  parse(input) {
    return parseVtt(input.content);
  },
  serialize(document, options) {
    return serializeVtt(document, options);
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
        id: "vtt-document",
        format: "vtt",
        tracks: [
          {
            id: "vtt-main",
            kind: "subtitle",
            cues: document.cues.map((cue) => ({
              id: cue.id,
              startMs: cue.startMs,
              endMs: cue.endMs,
              text: contentToPlainText(parseStyledText(cue.payload)),
              metadata: {
                identifier: cue.identifier,
                settings: cue.settings,
              },
            })),
          },
        ],
        metadata: {
          ...document.metadata,
          regions: document.regions,
          comments: document.comments,
          styles: document.styles,
        },
      }),
      issues: [],
    };
  },
  fromEditor(document: EditorTimedTextDocument) {
    const cues = document.tracks.flatMap((track) => track.cues);
    const issues: ConversionWarning[] = [];

    for (const cue of cues) {
      if (cue.speaker || cue.tags) {
        issues.push({
          id: `vtt_lossy_${cue.id}`,
          severity: "info",
          code: "vtt.lossy-editor-feature",
          message:
            "WebVTT export stores timing and text; speaker and editor tags remain editor-only metadata.",
          cueId: cue.id,
        });
      }
    }

    return {
      document: {
        type: "vtt",
        header: "WEBVTT",
        regions: readArrayMetadata(document, "regions"),
        comments: readArrayMetadata(document, "comments"),
        styles: readArrayMetadata(document, "styles"),
        metadata: document.metadata,
        cues: cues.map((cue) => ({
          id: cue.id,
          identifier: readCueMetadata(cue.metadata, "identifier"),
          startMs: cue.startMs,
          endMs: cue.endMs,
          payload: cue.text,
          settings: readCueMetadata(cue.metadata, "settings"),
        })),
      },
      issues,
    };
  },
  validate(document) {
    return validateVtt(document);
  },
};

function readArrayMetadata<T>(
  document: EditorTimedTextDocument,
  key: string,
): T[] {
  const value = document.metadata?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

function readCueMetadata<T>(
  metadata: Record<string, unknown> | undefined,
  key: string,
): T | undefined {
  return metadata?.[key] as T | undefined;
}
