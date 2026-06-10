import { deleteCueCommand } from "./handlers/delete-cue";
import { insertCueCommand } from "./handlers/insert-cue";
import { mergeCuesCommand } from "./handlers/merge-cues";
import { splitCueCommand } from "./handlers/split-cue";
import { updateCueTextCommand } from "./handlers/update-cue-text";
import { updateCueTimingCommand } from "./handlers/update-cue-timing";

/**
 * Convenience namespace for creating built-in editor commands.
 *
 * @example
 * ```ts
 * const command = editorCommands.updateCueText("cue-1", "Hello");
 * const result = command.do(document);
 * ```
 */
export const editorCommands = {
  insertCue: insertCueCommand,
  deleteCue: deleteCueCommand,
  updateCueText: updateCueTextCommand,
  updateCueTiming: updateCueTimingCommand,
  splitCue: splitCueCommand,
  mergeCues: mergeCuesCommand,
};
