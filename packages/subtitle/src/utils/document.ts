import type { DocumentInput, SubtitleDocument } from "../types";
import { createCue } from "./cue";

/**
 * Create a {@link SubtitleDocument} from a {@link DocumentInput}.
 *
 * This function takes the input data, processes the cues using `createCue`, and constructs a new document object with the specified format, cues, and metadata.
 *
 * @param input The input data for creating the subtitle document, including format, cues, and optional metadata.
 * @returns A new {@link SubtitleDocument} object constructed from the provided input.
 */
export function createDocument<TFormat extends string, TMetadata = unknown>(
  input: DocumentInput<TFormat, TMetadata>,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    format: input.format,
    cues: input.cues.map((c) => createCue(c)),
    metadata: input.metadata,
  };
}

/**
 * Get the total duration of a subtitle document by finding the maximum end time among all cues.
 *
 * @param doc The subtitle document for which to calculate the duration.
 * @returns The total duration of the document in milliseconds. If there are no cues, returns 0.
 */
export function getDocumentDuration(doc: SubtitleDocument): number {
  if (doc.cues.length === 0) return 0;
  const endTimes = doc.cues.map((c) => c.end.ms);
  return Math.max(...endTimes);
}

/**
 * Get the start time of a subtitle document by finding the minimum start time among all cues.
 *
 * @param doc The subtitle document for which to calculate the start time.
 * @returns The start time of the document in milliseconds. If there are no cues, returns 0.
 */
export function getDocumentStartTime(doc: SubtitleDocument): number {
  if (doc.cues.length === 0) return 0;
  const startTimes = doc.cues.map((c) => c.start.ms);
  return Math.min(...startTimes);
}

/**
 * Get the total number of cues in a subtitle document.
 *
 * @param doc The subtitle document for which to count the cues.
 * @returns The total number of cues in the document.
 */
export function getCueCount(doc: SubtitleDocument): number {
  return doc.cues.length;
}
