import type { Cue, CueContent, SubtitleDocument } from "../types";
import {
  contentToPlainText,
  generateCueId,
  plainTextToContent,
  time,
} from "../utils";

export type TextDistribution = "first" | "second" | "both" | "split";
export interface SplitOptions {
  textDistribution?: TextDistribution;
}

/**
 * Split a cue at a specific time into two cues.
 *
 * The original cue is replaced by two new cues:
 * - The first cue ends at the split time and contains content based on the textDistribution option.
 * - The second cue starts at the split time and contains content based on the textDistribution option.
 *
 * The textDistribution option determines how the original cue's content is distributed between the two new cues:
 * - "first": All content goes to the first cue, second cue is empty.
 * - "second": All content goes to the second cue, first cue is empty.
 * - "both": Both cues contain the full original content.
 * - "split": The content is split at the nearest word boundary to the midpoint of the original text.
 *
 * @param doc The subtitle document containing the cue to split.
 * @param cueId The ID of the cue to split.
 * @param splitTimeMs The time in milliseconds at which to split the cue.
 * @param options Optional settings for how to distribute text between the two new cues.
 * @returns A new subtitle document with the specified cue split into two cues.
 */
export function splitCue<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  cueId: string,
  splitTimeMs: number,
  options: SplitOptions = {},
): SubtitleDocument<TFormat, TMetadata> {
  const { textDistribution = "both" } = options;

  const cueIndex = doc.cues.findIndex((c) => c.id === cueId);
  if (cueIndex === -1) return doc;

  const cue = doc.cues[cueIndex];

  if (splitTimeMs <= cue.start.ms || splitTimeMs >= cue.end.ms) {
    return doc;
  }

  const [firstContent, secondContent] = distributeContent(
    cue.content,
    textDistribution,
  );

  const firstCue: Cue<TMetadata> = {
    ...cue,
    end: time(splitTimeMs),
    content: firstContent,
  };

  const secondCue: Cue<TMetadata> = {
    id: generateCueId(),
    start: time(splitTimeMs),
    end: cue.end,
    content: secondContent,
    metadata: cue.metadata,
  };

  const newCues = [...doc.cues];
  newCues.splice(cueIndex, 1, firstCue, secondCue);

  return {
    ...doc,
    cues: newCues,
  };
}

/**
 * Distribute cue content based on the specified text distribution method.
 *
 * Based on the textDistribution option, this function determines how to split the original cue content:
 * - "first": All content goes to the first cue, second cue is empty.
 * - "second": All content goes to the second cue, first cue is empty.
 * - "both": Both cues contain the full original content.
 * - "split": The content is split at the nearest word boundary to the midpoint of the original text.
 *
 * @param content The original cue content to distribute.
 * @param distribution The method to use for distributing the content: "first", "second", "both", or "split".
 * @returns A tuple containing the content for the first and second cues after distribution.
 */
function distributeContent(
  content: readonly CueContent[],
  distribution: TextDistribution,
): [CueContent[], CueContent[]] {
  const text = contentToPlainText(content);

  switch (distribution) {
    case "first":
      return [plainTextToContent(text), []];
    case "second":
      return [[], plainTextToContent(text)];
    case "split": {
      const midpoint = Math.floor(text.length / 2);
      const spaceBeforeMid = text.lastIndexOf(" ", midpoint);
      const spaceAfterMid = text.indexOf(" ", midpoint);

      let splitPoint: number;
      if (spaceBeforeMid !== -1) {
        splitPoint = spaceBeforeMid;
      } else if (spaceAfterMid !== -1) {
        splitPoint = spaceAfterMid;
      } else {
        splitPoint = midpoint;
      }

      return [
        plainTextToContent(text.slice(0, splitPoint).trim()),
        plainTextToContent(text.slice(splitPoint).trim()),
      ];
    }
    case "both":
    default:
      return [[...content], [...content]];
  }
}
