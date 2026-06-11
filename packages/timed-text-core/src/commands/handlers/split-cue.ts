import { generateId } from "../../document";
import { splitEditorCue } from "../../operations";
import { commandFailureFromOperation, commandSuccess } from "../results";
import type { EditorCommand } from "../types";
import { replaceCueRangeCommand } from "./replace-cue-range";
import { normalizeCommandContext } from "./shared";

/**
 * Payload used by {@link splitCueCommand}.
 *
 * @example
 * ```ts
 * const payload: SplitCuePayload = {
 *   cueId: "cue-1",
 *   atMs: 1_500,
 *   secondCueId: "cue-2",
 * };
 * ```
 */
export interface SplitCuePayload {
  cueId: string;
  atMs: number;
  firstText?: string;
  secondText?: string;
  secondCueId?: string;
}

/**
 * Command object returned by {@link splitCueCommand}.
 *
 * @example
 * ```ts
 * const command = splitCueCommand({ cueId: "cue-1", atMs: 1_500 });
 * ```
 */
export type SplitCueCommand = EditorCommand<SplitCuePayload>;

/**
 * Create a command that splits a cue.
 *
 * @param payload - Cue id, split time, optional text hints, and optional new cue id.
 * @returns Command that returns an undo command after a successful do.
 *
 * @example
 * ```ts
 * const result = splitCueCommand({ cueId: "cue-1", atMs: 1_500 }).do(document);
 * ```
 */
export function splitCueCommand(payload: SplitCuePayload): SplitCueCommand {
  return {
    type: "cue/split",
    payload,

    do(this: SplitCueCommand, document, contextInput) {
      const context = normalizeCommandContext(contextInput, generateId);
      const result = splitEditorCue(document, payload.cueId, payload.atMs, {
        createId: context.createId,
        firstText: payload.firstText,
        secondCueId: payload.secondCueId,
        secondText: payload.secondText,
      });
      if (!result.ok) return commandFailureFromOperation(document, this, result);

      return commandSuccess(result.document, this, {
        undoCommand: replaceCueRangeCommand({
          trackId: result.data.trackId,
          cueIds: [result.data.firstCue.id, result.data.secondCue.id],
          cues: [result.data.originalCue],
          index: result.data.index,
        }),
        events: [
          {
            type: "cue.split",
            cueId: result.data.originalCue.id,
            trackId: result.data.trackId,
            payload: {
              secondCueId: result.data.secondCue.id,
              atMs: payload.atMs,
            },
          },
        ],
      });
    },
  };
}
