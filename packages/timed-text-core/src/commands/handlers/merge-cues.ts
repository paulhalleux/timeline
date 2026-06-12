import { mergeEditorCues } from "../../operations";
import { commandFailureFromOperation, commandSuccess } from "../results";
import type { EditorCommand } from "../types";
import { replaceCueRangeCommand } from "./replace-cue-range";

/**
 * Payload used by {@link mergeCuesCommand}.
 *
 * @example
 * ```ts
 * const payload: MergeCuesPayload = {
 *   cueIds: ["cue-1", "cue-2"],
 *   separator: " ",
 * };
 * ```
 */
export interface MergeCuesPayload {
  cueIds: string[];
  separator?: string;
}

/**
 * Command object returned by {@link mergeCuesCommand}.
 *
 * @example
 * ```ts
 * const command = mergeCuesCommand({ cueIds: ["cue-1", "cue-2"] });
 * ```
 */
export type MergeCuesCommand = EditorCommand<MergeCuesPayload>;

/**
 * Create a command that merges cues.
 *
 * @param payload - Cue ids to merge and optional text separator.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const result = mergeCuesCommand({ cueIds: ["cue-1", "cue-2"] }).do(document);
 * ```
 */
export function mergeCuesCommand(payload: MergeCuesPayload): MergeCuesCommand {
  return {
    type: "cue/merge",
    payload,

    do(this: MergeCuesCommand, document) {
      const result = mergeEditorCues(document, payload.cueIds, {
        separator: payload.separator,
      });
      if (!result.ok) return commandFailureFromOperation(document, this, result);

      return commandSuccess(result.document, this, {
        undoCommand: replaceCueRangeCommand({
          trackId: result.data.trackId,
          cueIds: [result.data.mergedCue.id],
          cues: result.data.originalCues,
          index: result.data.index,
        }),
        events: [
          {
            type: "cue.merged",
            cueId: result.data.mergedCue.id,
            trackId: result.data.trackId,
            payload: { cueIds: result.data.originalCues.map((cue) => cue.id) },
          },
        ],
      });
    },
  };
}
