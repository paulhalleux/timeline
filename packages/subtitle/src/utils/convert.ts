import type { FormatParser } from "../formats";
import type { SubtitleDocument } from "../types";
import { contentToPlainText, plainTextToContent } from "./content";
import { createDocument } from "./document";

/**
 * Convert a document from one format to another.
 *
 * @note Some format-specific features may be lost during conversion.
 * @param doc The document to convert.
 * @param targetParser The parser for the target format.
 * @returns A new document in the target format.
 */
export function convertDocument<
  TSourceFormat extends string,
  TTargetFormat extends string,
  TTargetMetadata,
>(
  doc: SubtitleDocument<TSourceFormat, unknown>,
  targetParser: FormatParser<TTargetFormat, TTargetMetadata>,
): SubtitleDocument<TTargetFormat, TTargetMetadata> {
  const cues = doc.cues.map((cue) => ({
    id: cue.id,
    start: cue.start,
    end: cue.end,
    content: plainTextToContent(contentToPlainText(cue.content)),
    metadata: undefined as TTargetMetadata | undefined,
  }));

  return createDocument({
    format: targetParser.format,
    cues,
  });
}

/**
 * Clone a document.
 *
 * This function creates a deep copy of the provided document using the `structuredClone` method, which ensures that all nested properties are also cloned.
 *
 * @param doc The document to clone.
 * @returns A new document that is a deep copy of the original.
 */
export function cloneDocument<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
): SubtitleDocument<TFormat, TMetadata> {
  return structuredClone(doc);
}

/**
 * Change the format of a document without modifying content.
 *
 * @param doc The document to change.
 * @param newFormat The new format to set.
 * @returns A new document with the updated format.
 */
export function changeFormat<
  TSourceFormat extends string,
  TTargetFormat extends string,
  TMetadata,
>(
  doc: SubtitleDocument<TSourceFormat, TMetadata>,
  newFormat: TTargetFormat,
): SubtitleDocument<TTargetFormat, TMetadata> {
  return {
    ...doc,
    format: newFormat,
  };
}
