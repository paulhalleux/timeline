import type { EditorTimedTextCue, EditorTimedTextDocument } from "../editor-model";
import { findEditorCue } from "./utils";

/**
 * Return the first cue active at a time, scanning tracks in document order.
 *
 * @param document - Editor document to query.
 * @param timeMs - Time in milliseconds.
 * @returns The first active cue, or `undefined` when none is active.
 *
 * @example
 * ```ts
 * const cue = getEditorCueAt(document, playheadMs);
 * ```
 */
export function getEditorCueAt(
  document: EditorTimedTextDocument,
  timeMs: number,
): EditorTimedTextCue | undefined {
  return getEditorCuesAt(document, timeMs)[0];
}

/**
 * Return every cue active at a time across all tracks.
 *
 * @param document - Editor document to query.
 * @param timeMs - Time in milliseconds.
 * @returns All cues whose range contains `timeMs`.
 *
 * @example
 * ```ts
 * const activeCues = getEditorCuesAt(document, 12_000);
 * ```
 */
export function getEditorCuesAt(
  document: EditorTimedTextDocument,
  timeMs: number,
): EditorTimedTextCue[] {
  return document.tracks.flatMap((track) =>
    track.cues.filter((cue) => cue.startMs <= timeMs && cue.endMs >= timeMs),
  );
}

/**
 * Return cues that overlap or sit fully inside a time range.
 *
 * @param document - Editor document to query.
 * @param startMs - Range start in milliseconds.
 * @param endMs - Range end in milliseconds.
 * @param includePartial - Include cues that partially overlap the range.
 * @returns Matching cues across all tracks.
 *
 * @example
 * ```ts
 * const selected = getEditorCuesInRange(document, 5_000, 10_000, false);
 * ```
 */
export function getEditorCuesInRange(
  document: EditorTimedTextDocument,
  startMs: number,
  endMs: number,
  includePartial = true,
): EditorTimedTextCue[] {
  return document.tracks.flatMap((track) =>
    track.cues.filter((cue) =>
      includePartial
        ? cue.endMs >= startMs && cue.startMs <= endMs
        : cue.startMs >= startMs && cue.endMs <= endMs,
    ),
  );
}

/**
 * Return a cue by id, regardless of its track.
 *
 * @param document - Editor document to query.
 * @param cueId - Cue id to find.
 * @returns The cue when found, otherwise `undefined`.
 *
 * @example
 * ```ts
 * const cue = getEditorCueById(document, "cue-1");
 * ```
 */
export function getEditorCueById(
  document: EditorTimedTextDocument,
  cueId: string,
): EditorTimedTextCue | undefined {
  return findEditorCue(document, cueId)?.cue;
}

/**
 * Find all overlapping cue pairs within each track.
 *
 * @param document - Editor document to inspect.
 * @returns Pairs of cues whose time ranges intersect.
 *
 * @example
 * ```ts
 * const overlaps = findOverlappingEditorCues(document);
 * ```
 */
export function findOverlappingEditorCues(
  document: EditorTimedTextDocument,
): Array<[EditorTimedTextCue, EditorTimedTextCue]> {
  const overlaps: Array<[EditorTimedTextCue, EditorTimedTextCue]> = [];

  for (const track of document.tracks) {
    for (let i = 0; i < track.cues.length; i++) {
      for (let j = i + 1; j < track.cues.length; j++) {
        const first = track.cues[i];
        const second = track.cues[j];
        if (first.startMs < second.endMs && first.endMs > second.startMs) {
          overlaps.push([first, second]);
        }
      }
    }
  }

  return overlaps;
}

/**
 * Check whether any track contains overlapping cues.
 *
 * @param document - Editor document to inspect.
 * @returns `true` when at least one overlap exists.
 *
 * @example
 * ```ts
 * if (hasOverlappingEditorCues(document)) {
 *   showQcWarning();
 * }
 * ```
 */
export function hasOverlappingEditorCues(document: EditorTimedTextDocument): boolean {
  return findOverlappingEditorCues(document).length > 0;
}
