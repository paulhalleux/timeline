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

/**
 * Update the metadata of a document.
 *
 * @param doc The document to update.
 * @param newMetadata The new metadata to set.
 * @returns A new document with the updated metadata.
 */
export const updateDocumentMetadata = <TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  newMetadata: Record<string, unknown>,
): SubtitleDocument<TFormat, TMetadata> => {
  return {
    ...doc,
    metadata: newMetadata,
  };
};

/**
 * Get a metadata value from a document by key.
 *
 * @param doc The document to retrieve the metadata value from.
 * @param key The key of the metadata value to retrieve.
 * @param defaultValue An optional default value to return if the key does not exist in the document's metadata. If not provided, the function will return undefined when the key is not found.
 * @returns The metadata value associated with the specified key, or undefined if the key does not exist in the document's metadata.
 */
export const getMetadataValue = <TValue>(
  doc: SubtitleDocument,
  key: string,
  defaultValue?: TValue,
): TValue | undefined => {
  if (!doc.metadata) return defaultValue;
  return (doc.metadata[key] as TValue) ?? defaultValue;
};
