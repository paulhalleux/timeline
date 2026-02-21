import type { Cue, CueContent, SubtitleDocument } from "../types";
import {
  contentToPlainText,
  lineBreak,
  plainTextToContent,
  time,
} from "../utils";

export type TextCombination = "concat" | "space" | "first" | "second";

export interface MergeOptions {
  textCombination?: TextCombination;
  separator?: string;
}

/**
 * Merge multiple cues into one.
 *
 * The merged cue will take the ID and metadata of the first cue in the list.
 * The start time will be the earliest start time among the merged cues, and the end time will be the latest end time.
 * The content will be combined based on the specified text combination method.
 *
 * Based on the `textCombination` option:
 * - "concat" (default): Concatenate the content of all cues, inserting a line break between them.
 * - "space": Concatenate the content of all cues with a single space in between.
 * - "first": Use the content of the first cue only.
 * - "second": Use the content of the second cue only (if it exists, otherwise fallback to the first).
 *
 * @param doc - The subtitle document containing the cues to merge.
 * @param cueIds - An array of cue IDs to merge. Must contain at least two IDs.
 * @param options - Optional settings for how to combine the cue content.
 * @returns A new subtitle document with the specified cues merged into one.
 */
export function mergeCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  cueIds: string[],
  options: MergeOptions = {},
): SubtitleDocument<TFormat, TMetadata> {
  if (cueIds.length < 2) return doc;

  const { textCombination = "concat", separator } = options;

  const cuesToMerge: Cue<TMetadata>[] = [];

  for (let i = 0; i < doc.cues.length; i++) {
    if (cueIds.includes(doc.cues[i].id)) {
      cuesToMerge.push(doc.cues[i]);
    }
  }

  if (cuesToMerge.length < 2) return doc;

  // Sort by start time
  cuesToMerge.sort((a, b) => a.start.ms - b.start.ms);

  const mergedContent = combineContent(cuesToMerge, textCombination, separator);
  const startMs = Math.min(...cuesToMerge.map((c) => c.start.ms));
  const endMs = Math.max(...cuesToMerge.map((c) => c.end.ms));

  const mergedCue: Cue<TMetadata> = {
    id: cuesToMerge[0].id,
    start: time(startMs),
    end: time(endMs),
    content: mergedContent,
    metadata: cuesToMerge[0].metadata,
  };

  const idsToRemove = new Set(cueIds);
  idsToRemove.delete(mergedCue.id);

  const newCues = doc.cues
    .filter((c) => !idsToRemove.has(c.id))
    .map((c) => (c.id === mergedCue.id ? mergedCue : c));

  return {
    ...doc,
    cues: newCues,
  };
}

/**
 * Combine the content of multiple cues based on the specified text combination method.
 *
 * Based on the `textCombination` option:
 * - "concat" (default): Concatenate the content of all cues, inserting a line break between them.
 * - "space": Concatenate the content of all cues with a single space in between.
 * - "first": Use the content of the first cue only.
 * - "second": Use the content of the second cue only (if it exists, otherwise fallback to the first).
 *
 * @param cues - An array of cues whose content is to be combined.
 * @param combination - The method to use for combining the content.
 * @param separator - An optional separator string to use when the combination method is "concat".
 * @returns An array of CueContent representing the combined content.
 */
function combineContent<TMetadata>(
  cues: Cue<TMetadata>[],
  combination: TextCombination,
  separator?: string,
): CueContent[] {
  switch (combination) {
    case "first":
      return [...cues[0].content];
    case "second":
      return cues.length > 1 ? [...cues[1].content] : [...cues[0].content];
    case "space": {
      const texts = cues.map((c) => contentToPlainText(c.content));
      return plainTextToContent(texts.join(" "));
    }
    case "concat":
    default: {
      if (separator !== undefined) {
        const texts = cues.map((c) => contentToPlainText(c.content));
        return plainTextToContent(texts.join(separator));
      }

      const result: CueContent[] = [];
      for (let i = 0; i < cues.length; i++) {
        result.push(...cues[i].content);
        if (i < cues.length - 1) {
          result.push(lineBreak());
        }
      }
      return result;
    }
  }
}
