import type {
  ConversionWarning,
  EditorTimedTextDocument,
  FormatValidationIssue,
} from "./editor-model";

/**
 * Format identifiers supported by the timed-text adapter boundary.
 *
 * @example
 * ```ts
 * const format: TimedTextFormatId = "vtt";
 * ```
 */
export type TimedTextFormatId =
  | "srt"
  | "vtt"
  | "ass"
  | "ssa"
  | "ttml"
  | "scc"
  | "itt";

/**
 * Raw timed-text input passed to a format adapter.
 *
 * @example
 * ```ts
 * const input: TimedTextInput = {
 *   filename: "captions.vtt",
 *   content: fileText,
 *   encoding: "utf-8",
 * };
 * ```
 */
export interface TimedTextInput {
  filename?: string;
  content: string;
  encoding?: string;
}

/**
 * Serialization options shared by format adapters.
 *
 * @example
 * ```ts
 * const options: SerializeOptions = { newline: "\r\n" };
 * ```
 */
export interface SerializeOptions {
  newline?: "\n" | "\r\n";
}

/**
 * Result returned by native format parsing.
 *
 * @typeParam TDocument - Native document type produced by the adapter.
 *
 * @example
 * ```ts
 * const result = adapter.parse({ content });
 * console.log(result.document, result.issues);
 * ```
 */
export interface ParseResult<TDocument> {
  document: TDocument;
  issues: FormatValidationIssue[];
}

/**
 * Result returned by native format serialization.
 *
 * @example
 * ```ts
 * const result = adapter.serialize(nativeDocument);
 * writeFile(result.content);
 * ```
 */
export interface SerializeResult {
  content: string;
  issues: FormatValidationIssue[];
}

/**
 * Result returned when converting a native format into the editor model.
 *
 * @example
 * ```ts
 * const editor = adapter.toEditor(nativeDocument);
 * ```
 */
export interface NormalizationResult {
  document: EditorTimedTextDocument;
  issues: ConversionWarning[];
}

/**
 * Result returned when converting the editor model back into a native format.
 *
 * @typeParam TDocument - Native document type produced by the adapter.
 *
 * @example
 * ```ts
 * const native = adapter.fromEditor(editorDocument);
 * ```
 */
export interface DenormalizationResult<TDocument> {
  document: TDocument;
  issues: ConversionWarning[];
}

/**
 * Adapter contract for one timed-text format.
 *
 * Adapters own format-specific parsing, serialization, validation, and
 * conversion. Generic helpers and actions operate only on
 * {@link EditorTimedTextDocument} and should not depend on adapter internals.
 *
 * @typeParam TDocument - Native format document type.
 * @typeParam TCue - Native format cue type.
 *
 * @example
 * ```ts
 * registry.register(vttAdapter);
 * const native = registry.get("vtt").parse({ content });
 * ```
 */
export interface TimedTextAdapter<TDocument, TCue> {
  readonly format: TimedTextFormatId;
  readonly label: string;
  readonly extensions: readonly string[];

  parse(input: TimedTextInput): ParseResult<TDocument>;
  serialize(document: TDocument, options?: SerializeOptions): SerializeResult;

  getCues(document: TDocument): readonly TCue[];
  updateCue(document: TDocument, cueId: string, cue: TCue): TDocument;

  toEditor(document: TDocument): NormalizationResult;
  fromEditor(
    document: EditorTimedTextDocument,
  ): DenormalizationResult<TDocument>;

  validate(document: TDocument): FormatValidationIssue[];
}
