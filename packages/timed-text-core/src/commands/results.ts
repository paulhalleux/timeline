import type { FormatValidationIssue } from "../editor-model";
import type { EditorTimedTextDocument } from "../editor-model";
import type { EditorOperationFailure } from "../operations";
import type {
  EditorCommand,
  EditorCommandError,
  EditorCommandEvent,
  EditorCommandResult,
} from "./types";

/**
 * Create a successful command result.
 *
 * @param document - Updated editor document.
 * @param command - Command that was applied.
 * @param options - Optional undo command, events, and validation issues.
 * @returns A rich successful command result.
 *
 * @example
 * ```ts
 * return commandSuccess(document, command, { undoCommand });
 * ```
 */
export function commandSuccess(
  document: EditorTimedTextDocument,
  command: EditorCommand,
  options: {
    undoCommand?: EditorCommand;
    events?: EditorCommandEvent[];
    issues?: FormatValidationIssue[];
  } = {},
): EditorCommandResult {
  return {
    ok: true,
    document,
    command,
    undoCommand: options.undoCommand,
    events: options.events ?? [],
    issues: options.issues ?? [],
    errors: [],
  };
}

/**
 * Create a failed command result.
 *
 * @param document - Original editor document.
 * @param command - Command that failed.
 * @param error - Command error to report.
 * @param issues - Optional validation issues.
 * @returns A rich failed command result.
 *
 * @example
 * ```ts
 * return commandFailure(document, command, {
 *   code: "cue.not-found",
 *   message: "Cue does not exist.",
 * });
 * ```
 */
export function commandFailure(
  document: EditorTimedTextDocument,
  command: EditorCommand,
  error: EditorCommandError,
  issues: FormatValidationIssue[] = [],
): EditorCommandResult {
  return {
    ok: false,
    document,
    command,
    events: [],
    issues,
    errors: [error],
  };
}

/**
 * Convert a failed document operation into a failed command result.
 *
 * @param document - Original editor document.
 * @param command - Command whose delegated operation failed.
 * @param result - Failed operation result to convert.
 * @returns A rich failed command result.
 *
 * @example
 * ```ts
 * if (!operation.ok) {
 *   return commandFailureFromOperation(document, command, operation);
 * }
 * ```
 */
export function commandFailureFromOperation(
  document: EditorTimedTextDocument,
  command: EditorCommand,
  result: EditorOperationFailure,
): EditorCommandResult {
  return {
    ok: false,
    document,
    command,
    events: [],
    issues: [],
    errors: result.errors,
  };
}
