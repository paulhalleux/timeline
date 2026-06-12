import { updateEditorCueTiming } from "../../operations";
import { commandFailureFromOperation } from "../results";
import type { EditorCommand } from "../types";
import { replaceCueRangeCommand } from "./replace-cue-range";
import { cueUpdateSuccess } from "./update-result";

/**
 * Payload used by {@link updateCueTimingCommand}.
 *
 * @example
 * ```ts
 * const payload: UpdateCueTimingPayload = {
 *   cueId: "cue-1",
 *   startMs: 1_000,
 *   endMs: 2_000,
 * };
 * ```
 */
export interface UpdateCueTimingPayload {
  cueId: string;
  startMs: number;
  endMs: number;
}

/**
 * Command object returned by {@link updateCueTimingCommand}.
 *
 * @example
 * ```ts
 * const command = updateCueTimingCommand("cue-1", 1_000, 2_000);
 * ```
 */
export type UpdateCueTimingCommand = EditorCommand<UpdateCueTimingPayload>;

/**
 * Create a command that replaces cue timing.
 *
 * @param cueId - Cue id to update.
 * @param startMs - New start time in milliseconds.
 * @param endMs - New end time in milliseconds.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const result = updateCueTimingCommand("cue-1", 1_000, 2_000).do(document);
 * ```
 */
export function updateCueTimingCommand(
  cueId: string,
  startMs: number,
  endMs: number,
): UpdateCueTimingCommand {
  return {
    type: "cue/update-timing",
    payload: { cueId, startMs, endMs },

    do(this: UpdateCueTimingCommand, document) {
      const result = updateEditorCueTiming(document, cueId, startMs, endMs);
      if (!result.ok)
        return commandFailureFromOperation(document, this, result);

      return cueUpdateSuccess(
        this,
        result,
        replaceCueRangeCommand({
          trackId: result.data.trackId,
          cueIds: [result.data.cue.id],
          cues: [result.data.previousCue],
          index: result.data.index,
        }),
      );
    },
  };
}
