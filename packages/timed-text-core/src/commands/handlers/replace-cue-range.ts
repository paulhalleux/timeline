import type { EditorTimedTextCue } from "../../editor-model";
import { replaceEditorCueRange } from "../../operations";
import { commandFailureFromOperation, commandSuccess } from "../results";
import type { EditorCommand } from "../types";

/**
 * Payload used by {@link replaceCueRangeCommand}.
 *
 * @example
 * ```ts
 * const payload: ReplaceCueRangePayload = {
 *   trackId: "subtitles",
 *   cueIds: ["cue-1"],
 *   cues: [previousCue],
 * };
 * ```
 */
export interface ReplaceCueRangePayload {
  trackId: string;
  cueIds: string[];
  cues: EditorTimedTextCue[];
  index?: number;
}

/**
 * Command object returned by {@link replaceCueRangeCommand}.
 *
 * @example
 * ```ts
 * const command = replaceCueRangeCommand({
 *   trackId: "subtitles",
 *   cueIds: ["cue-1"],
 *   cues: [previousCue],
 * });
 * ```
 */
export type ReplaceCueRangeCommand = EditorCommand<ReplaceCueRangePayload>;

/**
 * Create a command that replaces a cue range.
 *
 * @param payload - Track id, cue ids to remove, replacement cues, and optional index.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const command = replaceCueRangeCommand({
 *   trackId: "subtitles",
 *   cueIds: ["cue-1"],
 *   cues: [replacementCue],
 * });
 * ```
 */
export function replaceCueRangeCommand(payload: ReplaceCueRangePayload): ReplaceCueRangeCommand {
  return {
    type: "cue/replace-range",
    payload,

    do(this: ReplaceCueRangeCommand, document) {
      const result = replaceEditorCueRange(
        document,
        payload.trackId,
        payload.cueIds,
        payload.cues,
        payload.index,
      );
      if (!result.ok) return commandFailureFromOperation(document, this, result);

      return commandSuccess(result.document, this, {
        undoCommand: replaceCueRangeCommand({
          trackId: result.data.trackId,
          cueIds: result.data.insertedCues.map((cue) => cue.id),
          cues: result.data.removedCues,
          index: result.data.index,
        }),
        events: [
          {
            type: "cue.range-replaced",
            trackId: result.data.trackId,
            payload: {
              removedCueIds: payload.cueIds,
              insertedCueIds: result.data.insertedCues.map((cue) => cue.id),
              index: result.data.index,
            },
          },
        ],
      });
    },
  };
}
