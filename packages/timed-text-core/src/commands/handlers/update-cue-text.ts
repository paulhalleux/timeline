import { updateEditorCue } from "../../operations";
import { commandFailureFromOperation } from "../results";
import type { EditorCommand } from "../types";
import { replaceCueRangeCommand } from "./replace-cue-range";
import { cueUpdateSuccess } from "./update-result";

/**
 * Payload used by {@link updateCueTextCommand}.
 *
 * @example
 * ```ts
 * const payload: UpdateCueTextPayload = {
 *   cueId: "cue-1",
 *   text: "Revised subtitle",
 * };
 * ```
 */
export interface UpdateCueTextPayload {
  cueId: string;
  text: string;
}

/**
 * Command object returned by {@link updateCueTextCommand}.
 *
 * @example
 * ```ts
 * const command = updateCueTextCommand("cue-1", "Hello");
 * ```
 */
export type UpdateCueTextCommand = EditorCommand<UpdateCueTextPayload>;

/**
 * Create a command that replaces cue text.
 *
 * @param cueId - Cue id to update.
 * @param text - Replacement plain text.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const result = updateCueTextCommand("cue-1", "Hello").do(document);
 * ```
 */
export function updateCueTextCommand(cueId: string, text: string): UpdateCueTextCommand {
  return {
    type: "cue/update-text",
    payload: { cueId, text },

    do(this: UpdateCueTextCommand, document) {
      const result = updateEditorCue(document, cueId, { text });
      if (!result.ok) return commandFailureFromOperation(document, this, result);

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
