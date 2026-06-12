import { deleteEditorCue } from "../../operations";
import { commandFailureFromOperation, commandSuccess } from "../results";
import type { EditorCommand } from "../types";
import { insertCueCommand } from "./insert-cue";

/**
 * Payload used by {@link deleteCueCommand}.
 *
 * @example
 * ```ts
 * const payload: DeleteCuePayload = { cueId: "cue-1" };
 * ```
 */
export interface DeleteCuePayload {
  cueId: string;
}

/**
 * Command object returned by {@link deleteCueCommand}.
 *
 * @example
 * ```ts
 * const command: DeleteCueCommand = deleteCueCommand("cue-1");
 * ```
 */
export type DeleteCueCommand = EditorCommand<DeleteCuePayload>;

/**
 * Create a command that deletes a cue by id.
 *
 * @param cueId - Cue id to delete.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const result = deleteCueCommand("cue-1").do(document);
 * ```
 */
export function deleteCueCommand(cueId: string): DeleteCueCommand {
  return {
    type: "cue/delete",
    payload: { cueId },
    do(this: DeleteCueCommand, document) {
      const result = deleteEditorCue(document, cueId);
      if (!result.ok) return commandFailureFromOperation(document, this, result);

      return commandSuccess(result.document, this, {
        undoCommand: insertCueCommand({
          trackId: result.data.trackId,
          cue: result.data.cue,
          index: result.data.index,
        }),
        events: [
          {
            type: "cue.deleted",
            cueId: result.data.cue.id,
            trackId: result.data.trackId,
            payload: { index: result.data.index },
          },
        ],
      });
    },
  };
}
