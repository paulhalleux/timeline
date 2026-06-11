import type { EditorTimedTextDocument, FormatValidationIssue } from "./editor-model";

/**
 * Context shared by native format validation rules.
 *
 * @example
 * ```ts
 * const context: FormatValidationContext = { filename: "captions.srt" };
 * ```
 */
export interface FormatValidationContext {
  filename?: string;
}

/**
 * Validation rule for a native timed-text document.
 *
 * @typeParam TDocument - Native document type the rule validates.
 *
 * @example
 * ```ts
 * const rule: FormatValidationRule<MyDocument> = {
 *   id: "format.required-header",
 *   run: (document) => [],
 * };
 * ```
 */
export interface FormatValidationRule<TDocument> {
  id: string;
  run(document: TDocument, context?: FormatValidationContext): FormatValidationIssue[];
}

/**
 * Validation rule for the normalized editor model.
 *
 * @example
 * ```ts
 * const rule: EditorValidationRule = {
 *   id: "editor.invalid-timing",
 *   run: (document) => [],
 * };
 * ```
 */
export interface EditorValidationRule {
  id: string;
  run(document: EditorTimedTextDocument): FormatValidationIssue[];
}

/**
 * Run native format validation rules.
 *
 * @typeParam TDocument - Native document type being validated.
 * @param document - Native document to validate.
 * @param rules - Validation rules to execute.
 * @param context - Optional validation context.
 * @returns Flattened validation issues from every rule.
 *
 * @example
 * ```ts
 * const issues = runFormatValidation(nativeDocument, rules, {
 *   filename: "captions.vtt",
 * });
 * ```
 */
export function runFormatValidation<TDocument>(
  document: TDocument,
  rules: readonly FormatValidationRule<TDocument>[],
  context?: FormatValidationContext,
): FormatValidationIssue[] {
  return rules.flatMap((rule) => rule.run(document, context));
}
