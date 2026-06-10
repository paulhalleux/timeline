import type { EditorTimedTextDocument } from "../editor-model";

/**
 * Machine-readable error returned by editor-document operations.
 *
 * @example
 * ```ts
 * const error: EditorOperationError = {
 *   code: "cue.not-found",
 *   message: "Cue does not exist.",
 *   cueId: "cue-1",
 * };
 * ```
 */
export interface EditorOperationError {
  code: string;
  message: string;
  cueId?: string;
  trackId?: string;
}

/**
 * Successful result for a pure document operation.
 *
 * Operations stay independent of command history. Extra data is returned as
 * `data` so callers such as command handlers can build events and inverses.
 *
 * @typeParam TData - Operation-specific metadata.
 *
 * @example
 * ```ts
 * const result = insertEditorCue(document, "track-1", cue);
 * if (result.ok) {
 *   result.data.index;
 * }
 * ```
 */
export interface EditorOperationSuccess<TData = undefined> {
  ok: true;
  document: EditorTimedTextDocument;
  data: TData;
}

/**
 * Failed operation result. Failed operations never mutate the input document.
 *
 * @example
 * ```ts
 * const result = deleteEditorCue(document, "missing");
 * if (!result.ok) {
 *   console.error(result.errors[0].code);
 * }
 * ```
 */
export interface EditorOperationFailure {
  ok: false;
  document: EditorTimedTextDocument;
  errors: EditorOperationError[];
}

/**
 * Union returned by editor-document operations.
 *
 * @typeParam TData - Operation-specific success metadata.
 *
 * @example
 * ```ts
 * const result: EditorOperationResult = deleteEditorCue(document, "cue-1");
 * ```
 */
export type EditorOperationResult<TData = undefined> =
  | EditorOperationSuccess<TData>
  | EditorOperationFailure;

/**
 * Create a successful operation result.
 *
 * @typeParam TData - Operation-specific success metadata.
 * @param document - Updated editor document.
 * @param data - Operation-specific metadata.
 * @returns A successful operation result.
 *
 * @example
 * ```ts
 * return operationSuccess(document, { cue });
 * ```
 */
export function operationSuccess<TData>(
  document: EditorTimedTextDocument,
  data: TData,
): EditorOperationSuccess<TData> {
  return { ok: true, document, data };
}

/**
 * Create a failed operation result.
 *
 * @param document - Original editor document.
 * @param error - Machine-readable operation error.
 * @returns A failed operation result.
 *
 * @example
 * ```ts
 * return operationFailure(document, {
 *   code: "cue.not-found",
 *   message: "Cue does not exist.",
 * });
 * ```
 */
export function operationFailure(
  document: EditorTimedTextDocument,
  error: EditorOperationError,
): EditorOperationFailure {
  return { ok: false, document, errors: [error] };
}
