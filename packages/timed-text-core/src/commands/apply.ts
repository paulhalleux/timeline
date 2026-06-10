import type { EditorTimedTextDocument } from "../editor-model";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandResult,
} from "./types";

/**
 * Apply a command to an editor document by calling its `do` method.
 *
 * This helper is intentionally tiny: there is no command registry and no
 * command union dispatch. The command object owns its behavior.
 *
 * @param document - Current editor document.
 * @param command - Command object to apply.
 * @param context - Optional command dependencies.
 * @returns Result produced by the command.
 *
 * @example
 * ```ts
 * const command = updateCueTextCommand("cue-1", "Hello");
 * const result = applyEditorCommand(document, command);
 * ```
 */
export function applyEditorCommand(
  document: EditorTimedTextDocument,
  command: EditorCommand,
  context?: EditorCommandContext,
): EditorCommandResult {
  return command.do(document, context);
}
