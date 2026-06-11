import type { EditorOperationSuccess, UpdateEditorCueData } from "../../operations";
import { commandSuccess } from "../results";
import type { EditorCommand, EditorCommandResult } from "../types";
import type { UpdateCueTextCommand } from "./update-cue-text";
import type { UpdateCueTimingCommand } from "./update-cue-timing";

/**
 * Build the standard command result for cue update operations.
 *
 * @param command - Cue update command that was applied.
 * @param result - Successful update operation result.
 * @returns Command result with update events.
 *
 * @example
 * ```ts
 * return cueUpdateSuccess(command, operationResult);
 * ```
 */
export function cueUpdateSuccess(
  command: UpdateCueTextCommand | UpdateCueTimingCommand,
  result: EditorOperationSuccess<UpdateEditorCueData>,
  undoCommand: EditorCommand,
): EditorCommandResult {
  return commandSuccess(result.document, command, {
    undoCommand,
    events: [
      {
        type: "cue.updated",
        cueId: result.data.cue.id,
        trackId: result.data.trackId,
      },
    ],
  });
}
