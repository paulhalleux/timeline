import type { EditorTimedTextDocument } from "../editor-model";
import type { EditorOperationResult } from "./results";
import type { UpdateEditorCueData } from "./transform";
import { mapEditorCues, sortEditorCuesByTime, updateEditorCue } from "./transform";

/**
 * Strategy used by {@link fixEditorOverlaps}.
 *
 * @example
 * ```ts
 * const mode: FixOverlapMode = "trim";
 * ```
 */
export type FixOverlapMode = "trim" | "remove";

/**
 * Strategy used by {@link adjustEditorGaps}.
 *
 * @example
 * ```ts
 * const mode: AdjustGapMode = "shift";
 * ```
 */
export type AdjustGapMode = "extend" | "shift";

/**
 * Update one cue's start and end time.
 *
 * @param document - Editor document to update.
 * @param cueId - Cue id to retime.
 * @param startMs - New start time in milliseconds.
 * @param endMs - New end time in milliseconds. Must be greater than `startMs`.
 * @returns An operation result containing previous and updated cue snapshots.
 *
 * @example
 * ```ts
 * const result = updateEditorCueTiming(document, "cue-1", 1_000, 2_500);
 * ```
 */
export function updateEditorCueTiming(
  document: EditorTimedTextDocument,
  cueId: string,
  startMs: number,
  endMs: number,
): EditorOperationResult<UpdateEditorCueData> {
  if (startMs >= endMs) {
    return {
      ok: false,
      document,
      errors: [
        {
          code: "cue.invalid-timing",
          message: "Cannot update cue timing because startMs must be before endMs.",
          cueId,
        },
      ],
    };
  }

  return updateEditorCue(document, cueId, { startMs, endMs });
}

/**
 * Shift specific cues, or all cues when `cueIds` is omitted.
 *
 * @param document - Editor document to transform.
 * @param offsetMs - Milliseconds to add to cue start and end times.
 * @param cueIds - Optional cue ids to shift. When omitted, every cue shifts.
 * @returns A new document with shifted cue timings clamped to zero.
 *
 * @example
 * ```ts
 * const delayed = shiftEditorCues(document, 500, ["cue-1"]);
 * ```
 */
export function shiftEditorCues(
  document: EditorTimedTextDocument,
  offsetMs: number,
  cueIds?: readonly string[],
): EditorTimedTextDocument {
  const idSet = cueIds ? new Set(cueIds) : undefined;
  return mapEditorCues(document, (cue) => {
    if (idSet && !idSet.has(cue.id)) return cue;
    return {
      ...cue,
      startMs: Math.max(0, cue.startMs + offsetMs),
      endMs: Math.max(0, cue.endMs + offsetMs),
    };
  });
}

/**
 * Scale cue timings around an anchor point.
 *
 * @param document - Editor document to transform.
 * @param factor - Scale factor. Values less than or equal to zero are ignored.
 * @param anchorMs - Time in milliseconds that remains fixed during scaling.
 * @returns A new document with scaled cue timings.
 *
 * @example
 * ```ts
 * const faster = scaleEditorCues(document, 0.5);
 * ```
 */
export function scaleEditorCues(
  document: EditorTimedTextDocument,
  factor: number,
  anchorMs = 0,
): EditorTimedTextDocument {
  if (factor <= 0) return document;

  return mapEditorCues(document, (cue) => ({
    ...cue,
    startMs: anchorMs + (cue.startMs - anchorMs) * factor,
    endMs: anchorMs + (cue.endMs - anchorMs) * factor,
  }));
}

/**
 * Snap all cue timings to the nearest frame boundary.
 *
 * @param document - Editor document to transform.
 * @param frameRate - Frame rate used to compute frame duration.
 * @returns A new document with cue timings rounded to frame boundaries.
 *
 * @example
 * ```ts
 * const frameAligned = snapEditorCuesToFrames(document, 24);
 * ```
 */
export function snapEditorCuesToFrames(
  document: EditorTimedTextDocument,
  frameRate: number,
): EditorTimedTextDocument {
  const frameDuration = 1000 / frameRate;

  return mapEditorCues(document, (cue) => {
    const startMs = Math.round(cue.startMs / frameDuration) * frameDuration;
    const endMs = Math.round(cue.endMs / frameDuration) * frameDuration;

    return {
      ...cue,
      startMs,
      endMs: Math.max(startMs + frameDuration, endMs),
    };
  });
}

/**
 * Fix overlapping cues independently per track.
 *
 * In `trim` mode, one overlapping cue is shortened. In `remove` mode, one cue
 * in each overlap is removed. Prioritized cue ids are preserved when possible.
 *
 * @param document - Editor document to transform.
 * @param mode - Strategy for resolving overlaps.
 * @param prioritizeIds - Cue ids that should win overlap conflicts.
 * @returns A new document with overlaps fixed per track.
 *
 * @example
 * ```ts
 * const fixed = fixEditorOverlaps(document, "trim", ["cue-important"]);
 * ```
 */
export function fixEditorOverlaps(
  document: EditorTimedTextDocument,
  mode: FixOverlapMode = "trim",
  prioritizeIds: readonly string[] = [],
): EditorTimedTextDocument {
  const prioritized = new Set(prioritizeIds);

  return {
    ...document,
    tracks: document.tracks.map((track) => {
      const cues = [...track.cues].sort((a, b) => a.startMs - b.startMs);
      const toRemove = new Set<string>();

      for (let i = 0; i < cues.length - 1; i++) {
        const current = cues[i];
        const next = cues[i + 1];

        if (current.endMs <= next.startMs) continue;

        const sacrificeCurrent = prioritized.has(next.id) && !prioritized.has(current.id);

        if (mode === "remove") {
          toRemove.add(sacrificeCurrent ? current.id : next.id);
        } else if (sacrificeCurrent) {
          cues[i] = { ...current, endMs: next.startMs };
        } else {
          cues[i + 1] = { ...next, startMs: current.endMs };
        }
      }

      return {
        ...track,
        cues: mode === "remove" ? cues.filter((cue) => !toRemove.has(cue.id)) : cues,
      };
    }),
  };
}

/**
 * Adjust gaps between consecutive cues independently per track.
 *
 * @param document - Editor document to transform.
 * @param gapMs - Desired gap between adjacent cues.
 * @param mode - `extend` changes the previous cue; `shift` moves following cues.
 * @returns A new document with adjusted inter-cue gaps.
 *
 * @example
 * ```ts
 * const conformed = adjustEditorGaps(document, 2, "extend");
 * ```
 */
export function adjustEditorGaps(
  document: EditorTimedTextDocument,
  gapMs: number,
  mode: AdjustGapMode = "extend",
): EditorTimedTextDocument {
  const sortedDocument = sortEditorCuesByTime(document);

  return {
    ...sortedDocument,
    tracks: sortedDocument.tracks.map((track) => {
      const cues = [...track.cues];
      for (let i = 0; i < cues.length - 1; i++) {
        const current = cues[i];
        const next = cues[i + 1];
        const currentGap = next.startMs - current.endMs;

        if (currentGap === gapMs) continue;

        if (mode === "extend") {
          cues[i] = { ...current, endMs: next.startMs - gapMs };
        } else {
          const shiftAmount = gapMs - currentGap;
          for (let j = i + 1; j < cues.length; j++) {
            cues[j] = {
              ...cues[j],
              startMs: cues[j].startMs + shiftAmount,
              endMs: cues[j].endMs + shiftAmount,
            };
          }
        }
      }

      return { ...track, cues };
    }),
  };
}
