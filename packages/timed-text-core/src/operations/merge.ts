import type {
  EditorTimedTextCue,
  EditorTimedTextDocument,
} from "../editor-model";
import type { EditorOperationResult } from "./results";
import { operationFailure, operationSuccess } from "./results";
import { findEditorCue } from "./utils";

/**
 * Strategy for combining text while merging cues.
 *
 * @example
 * ```ts
 * const combination: TextCombination = "space";
 * ```
 */
export type TextCombination = "concat" | "space" | "first" | "second";

/**
 * Options for {@link mergeEditorCues}.
 *
 * @example
 * ```ts
 * const options: MergeEditorCuesOptions = {
 *   textCombination: "concat",
 *   separator: "\n",
 * };
 * ```
 */
export interface MergeEditorCuesOptions {
  textCombination?: TextCombination;
  separator?: string;
}

/**
 * Metadata returned after merging editor cues.
 *
 * @example
 * ```ts
 * const mergedCue = result.ok ? result.data.mergedCue : undefined;
 * ```
 */
export interface MergeEditorCuesData {
  trackId: string;
  index: number;
  originalCues: EditorTimedTextCue[];
  mergedCue: EditorTimedTextCue;
}

/**
 * Merge two or more cues into one cue within a single track.
 *
 * @param document - Editor document to update.
 * @param cueIds - Cue ids to merge. All cues must exist in the same track.
 * @param options - Optional text-combination behavior.
 * @returns An operation result with the merged cue and original cue snapshots.
 *
 * @example
 * ```ts
 * const result = mergeEditorCues(document, ["cue-1", "cue-2"], {
 *   separator: " ",
 * });
 * ```
 */
export function mergeEditorCues(
  document: EditorTimedTextDocument,
  cueIds: readonly string[],
  options: MergeEditorCuesOptions = {},
): EditorOperationResult<MergeEditorCuesData> {
  if (cueIds.length < 2) {
    return operationFailure(document, {
      code: "cue.merge-too-few",
      message: "Cannot merge fewer than two cues.",
    });
  }

  const located = cueIds.map((cueId) => findEditorCue(document, cueId));
  if (located.some((result) => !result)) {
    return operationFailure(document, {
      code: "cue.not-found",
      message: "Cannot merge cues because one or more cues do not exist.",
    });
  }

  const cueResults = located.filter((result) => result !== undefined);
  const trackId = cueResults[0].track.id;
  if (cueResults.some((result) => result.track.id !== trackId)) {
    return operationFailure(document, {
      code: "cue.merge-cross-track",
      message: "Cannot merge cues across different tracks.",
      trackId,
    });
  }

  const sorted = [...cueResults].sort((a, b) => a.cueIndex - b.cueIndex);
  const originalCues = sorted.map((result) => result.cue);
  const mergedCue: EditorTimedTextCue = {
    ...originalCues[0],
    startMs: Math.min(...originalCues.map((cue) => cue.startMs)),
    endMs: Math.max(...originalCues.map((cue) => cue.endMs)),
    text: combineText(originalCues, options),
  };
  const cueIdSet = new Set(originalCues.map((cue) => cue.id));
  const track = sorted[0].track;
  const insertionIndex = sorted[0].cueIndex;
  const remainingCues = track.cues.filter((cue) => !cueIdSet.has(cue.id));
  const nextCues = [
    ...remainingCues.slice(0, insertionIndex),
    mergedCue,
    ...remainingCues.slice(insertionIndex),
  ];
  const nextDocument = {
    ...document,
    tracks: document.tracks.map((candidate) =>
      candidate.id === trackId ? { ...track, cues: nextCues } : candidate,
    ),
  };

  return operationSuccess(nextDocument, {
    trackId,
    index: insertionIndex,
    originalCues,
    mergedCue,
  });
}

function combineText(
  cues: readonly EditorTimedTextCue[],
  options: MergeEditorCuesOptions,
): string {
  switch (options.textCombination ?? "concat") {
    case "first":
      return cues[0].text;
    case "second":
      return cues[1]?.text ?? cues[0].text;
    case "space":
      return cues.map((cue) => cue.text).join(" ");
    case "concat":
    default:
      return cues.map((cue) => cue.text).join(options.separator ?? "\n");
  }
}
