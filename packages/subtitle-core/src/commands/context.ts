import type { EditorTimedTextDocument } from "@ptl/timed-text-core";
import type { CommitOperationResultInput } from "../documents/document-service";
import type { SubtitleSelectionService } from "../selection";

/**
 * Optional read-only selection service commonly used by cue-oriented commands.
 *
 * Host packages own concrete selection state. Command handlers only need this
 * shared read surface to resolve "current cue" style behavior without
 * importing editor components.
 */
export type TimedTextCommandSelectionService = Pick<
  SubtitleSelectionService,
  "getSelection" | "subscribe"
>;

/**
 * Runtime context for built-in timed-text command handlers.
 *
 * @example
 * ```ts
 * registerTimedTextCommandHandlers(registry, {
 *   getDocument: () => editorState.document,
 *   createId: prefix => `${prefix}-${crypto.randomUUID()}`,
 * });
 * ```
 */
export interface TimedTextCommandContext {
  getDocument(): EditorTimedTextDocument;
  setDocument?(document: EditorTimedTextDocument): void;
  commitOperationResult?<TData>(input: CommitOperationResultInput<TData>): TData;
  selection?: TimedTextCommandSelectionService;
  createId?: (prefix: string) => string;
}
