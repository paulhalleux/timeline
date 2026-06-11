import type { EditorTimedTextCue, EditorTimedTextDocument } from "../editor-model";
import type { EditorOperationResult } from "./results";
import { operationFailure, operationSuccess } from "./results";
import { clampIndex, findEditorTrack } from "./utils";

/**
 * Metadata returned after replacing a cue range.
 *
 * @example
 * ```ts
 * if (result.ok) {
 *   result.data.removedCues;
 *   result.data.insertedCues;
 * }
 * ```
 */
export interface ReplaceEditorCueRangeData {
  trackId: string;
  removedCues: EditorTimedTextCue[];
  insertedCues: EditorTimedTextCue[];
  index: number;
}

/**
 * Replace a set of cue ids with a new cue range.
 *
 * This low-level helper is useful for exact undo snapshots, but it remains a
 * document operation and does not know anything about command history.
 *
 * @param document - Editor document to update.
 * @param trackId - Track where the replacement should happen.
 * @param cueIds - Existing cue ids to remove.
 * @param cues - Replacement cues to insert.
 * @param index - Optional insertion index for the replacement range.
 * @returns An operation result with removed and inserted cue snapshots.
 *
 * @example
 * ```ts
 * const result = replaceEditorCueRange(
 *   document,
 *   "subtitles",
 *   ["cue-1", "cue-2"],
 *   [mergedCue],
 * );
 * ```
 */
export function replaceEditorCueRange(
  document: EditorTimedTextDocument,
  trackId: string,
  cueIds: readonly string[],
  cues: readonly EditorTimedTextCue[],
  index?: number,
): EditorOperationResult<ReplaceEditorCueRangeData> {
  const trackResult = findEditorTrack(document, trackId);
  if (!trackResult) {
    return operationFailure(document, {
      code: "track.not-found",
      message: "Cannot replace cue range because the track does not exist.",
      trackId,
    });
  }

  const cueIdSet = new Set(cueIds);
  const firstMatchedIndex = trackResult.track.cues.findIndex((cue) => cueIdSet.has(cue.id));
  const replacementIndex = clampIndex(
    index ?? (firstMatchedIndex === -1 ? trackResult.track.cues.length : firstMatchedIndex),
    trackResult.track.cues.length,
  );
  const removedCues = trackResult.track.cues.filter((cue) => cueIdSet.has(cue.id));
  const remainingCues = trackResult.track.cues.filter((cue) => !cueIdSet.has(cue.id));
  const insertionIndex = clampIndex(replacementIndex, remainingCues.length);
  const nextCues = [
    ...remainingCues.slice(0, insertionIndex),
    ...cues,
    ...remainingCues.slice(insertionIndex),
  ];
  const nextDocument = {
    ...document,
    tracks: document.tracks.map((track) =>
      track.id === trackId ? { ...track, cues: nextCues } : track,
    ),
  };

  return operationSuccess(nextDocument, {
    trackId,
    removedCues,
    insertedCues: [...cues],
    index: replacementIndex,
  });
}
