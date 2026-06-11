import type { EditorTimedTextDocument, FormatValidationIssue } from "../editor-model";

/**
 * Optional serializable metadata for auditing, collaboration, and history UI.
 *
 * @example
 * ```ts
 * const metadata: EditorCommandMetadata = {
 *   actorId: "user-1",
 *   reason: "manual edit",
 * };
 * ```
 */
export interface EditorCommandMetadata {
  createdAt?: string;
  actorId?: string;
  reason?: string;
}

/**
 * Runtime hooks available while applying a command.
 *
 * Supplying deterministic `createId` values makes command execution fully
 * reproducible in tests and collaborative replay.
 *
 * @example
 * ```ts
 * const context: EditorCommandContext = {
 *   createId: () => "cue-2",
 *   now: () => new Date("2026-01-01T00:00:00.000Z"),
 * };
 * ```
 */
export interface EditorCommandContext {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Command context after defaults have been applied.
 *
 * @example
 * ```ts
 * const context: NormalizedEditorCommandContext = {
 *   now: () => new Date(),
 *   createId: (prefix) => `${prefix}-1`,
 * };
 * ```
 */
export type NormalizedEditorCommandContext = Required<EditorCommandContext>;

/**
 * A command that can apply an editor-document change.
 *
 * Commands are deliberately not registered in a central registry. A history
 * middleware can call `do` and store the returned `undoCommand`.
 *
 * @typeParam TPayload - Command-specific payload shape.
 *
 * @example
 * ```ts
 * const command = updateCueTextCommand("cue-1", "Hello");
 * const result = command.do(document);
 * const undone = result.undoCommand?.do(result.document);
 * ```
 */
export interface EditorCommand<TPayload = unknown> {
  id?: string;
  type: string;
  payload: TPayload;
  metadata?: EditorCommandMetadata;
  do(document: EditorTimedTextDocument, context?: EditorCommandContext): EditorCommandResult;
}

/**
 * Result returned after applying a command.
 *
 * Failed commands keep the original document. Successful commands can be
 * undone by applying the returned `undoCommand`.
 *
 * @example
 * ```ts
 * const result = command.do(document);
 * if (result.ok && result.undoCommand) {
 *   history.push(result.undoCommand);
 * }
 * ```
 */
export interface EditorCommandResult {
  ok: boolean;
  document: EditorTimedTextDocument;
  command: EditorCommand;
  undoCommand?: EditorCommand;
  events: EditorCommandEvent[];
  issues: FormatValidationIssue[];
  errors: EditorCommandError[];
}

/**
 * Event emitted by successful command execution.
 *
 * @example
 * ```ts
 * const event: EditorCommandEvent = {
 *   type: "cue.updated",
 *   cueId: "cue-1",
 * };
 * ```
 */
export interface EditorCommandEvent {
  type: string;
  cueId?: string;
  trackId?: string;
  payload?: Record<string, unknown>;
}

/**
 * Machine-readable command error.
 *
 * @example
 * ```ts
 * const error: EditorCommandError = {
 *   code: "cue.not-found",
 *   message: "Cue does not exist.",
 *   cueId: "cue-1",
 * };
 * ```
 */
export interface EditorCommandError {
  code: string;
  message: string;
  cueId?: string;
  trackId?: string;
}
