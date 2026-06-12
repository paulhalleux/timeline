import type { EditorTimedTextCue } from "../../editor-model";
import { insertEditorCue } from "../../operations";
import { commandFailureFromOperation, commandSuccess } from "../results";
import type { EditorCommand } from "../types";
import { deleteCueCommand } from "./delete-cue";

/**
 * Payload used by {@link insertCueCommand}.
 *
 * @example
 * ```ts
 * const payload: InsertCuePayload = {
 *   trackId: "subtitles",
 *   cue,
 *   index: 0,
 * };
 * ```
 */
export interface InsertCuePayload {
  trackId: string;
  cue: EditorTimedTextCue;
  index?: number;
}

/**
 * Command object returned by {@link insertCueCommand}.
 *
 * @example
 * ```ts
 * const command: InsertCueCommand = insertCueCommand({ trackId, cue });
 * ```
 */
export type InsertCueCommand = EditorCommand<InsertCuePayload>;

/**
 * Create a command that inserts a cue into a track.
 *
 * @param payload - Track id, cue, and optional insertion index.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const command = insertCueCommand({ trackId: "subtitles", cue });
 * const result = command.do(document);
 * ```
 */
export function insertCueCommand(payload: InsertCuePayload): InsertCueCommand {
  return {
    type: "cue/insert",
    payload,

    do(this: InsertCueCommand, document) {
      const result = insertEditorCue(document, payload.trackId, payload.cue, payload.index);
      if (!result.ok) return commandFailureFromOperation(document, this, result);

      return commandSuccess(result.document, this, {
        undoCommand: deleteCueCommand(result.data.cue.id),
        events: [
          {
            type: "cue.inserted",
            cueId: result.data.cue.id,
            trackId: result.data.trackId,
            payload: { index: result.data.index },
          },
        ],
      });
    },
  };
}
