import type {
  EditorTimedTextCue,
  EditorTimedTextDocument,
} from "../editor-model";
import type { EditorOperationResult } from "./results";
import { operationFailure, operationSuccess } from "./results";
import { findEditorCue, splitPlainText } from "./utils";

/**
 * Strategy for distributing text while splitting a cue.
 *
 * @example
 * ```ts
 * const distribution: TextDistribution = "split";
 * ```
 */
export type TextDistribution = "first" | "second" | "both" | "split";

/**
 * Options for {@link splitEditorCue}.
 *
 * @example
 * ```ts
 * const options: SplitEditorCueOptions = {
 *   createId: () => "cue-2",
 *   textDistribution: "both",
 * };
 * ```
 */
export interface SplitEditorCueOptions {
  createId?: (prefix: string) => string;
  secondCueId?: string;
  textDistribution?: TextDistribution;
  firstText?: string;
  secondText?: string;
}

/**
 * Metadata returned after splitting an editor cue.
 *
 * @example
 * ```ts
 * const secondCueId = result.ok ? result.data.secondCue.id : undefined;
 * ```
 */
export interface SplitEditorCueData {
  trackId: string;
  index: number;
  originalCue: EditorTimedTextCue;
  firstCue: EditorTimedTextCue;
  secondCue: EditorTimedTextCue;
}

/**
 * Split a cue into two cues in the editor model.
 *
 * This operation is generic editor-model logic. It does not know about SRT,
 * VTT, ASS, selection state, or undo history. Callers can inject `createId`
 * when deterministic ids are required.
 *
 * @param document - Editor document to update.
 * @param cueId - Cue id to split.
 * @param atMs - Split point in milliseconds. Must be inside the cue range.
 * @param options - Optional text distribution and id dependencies.
 * @returns An operation result with the original cue and both replacement cues.
 *
 * @example
 * ```ts
 * const result = splitEditorCue(document, "cue-1", 2_000, {
 *   createId: () => "cue-2",
 *   textDistribution: "split",
 * });
 * ```
 */
export function splitEditorCue(
  document: EditorTimedTextDocument,
  cueId: string,
  atMs: number,
  options: SplitEditorCueOptions = {},
): EditorOperationResult<SplitEditorCueData> {
  const cueResult = findEditorCue(document, cueId);
  if (!cueResult) {
    return operationFailure(document, {
      code: "cue.not-found",
      message: "Cannot split cue because it does not exist.",
      cueId,
    });
  }

  const { cue, track } = cueResult;
  if (atMs <= cue.startMs || atMs >= cue.endMs) {
    return operationFailure(document, {
      code: "cue.split-out-of-range",
      message: "Cannot split cue outside its time range.",
      cueId,
    });
  }

  const [firstText, secondText] = distributeText(cue.text, options);
  const firstCue: EditorTimedTextCue = {
    ...cue,
    endMs: atMs,
    text: firstText,
  };
  const secondCue: EditorTimedTextCue = {
    ...cue,
    id: options.secondCueId ?? options.createId?.("cue") ?? `${cue.id}_split`,
    startMs: atMs,
    text: secondText,
  };
  const nextCues = [...track.cues];
  nextCues.splice(cueResult.cueIndex, 1, firstCue, secondCue);
  const nextDocument = {
    ...document,
    tracks: document.tracks.map((candidate) =>
      candidate.id === track.id ? { ...track, cues: nextCues } : candidate,
    ),
  };

  return operationSuccess(nextDocument, {
    trackId: track.id,
    index: cueResult.cueIndex,
    originalCue: cue,
    firstCue,
    secondCue,
  });
}

function distributeText(
  text: string,
  options: SplitEditorCueOptions,
): [string, string] {
  if (options.firstText !== undefined || options.secondText !== undefined) {
    return [options.firstText ?? "", options.secondText ?? ""];
  }

  switch (options.textDistribution ?? "split") {
    case "first":
      return [text, ""];
    case "second":
      return ["", text];
    case "both":
      return [text, text];
    case "split":
    default:
      return splitPlainText(text);
  }
}
