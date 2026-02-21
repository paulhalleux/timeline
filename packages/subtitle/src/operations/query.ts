import type { Cue, SubtitleDocument } from "../types";
import { isCueAtTime } from "../utils";

/**
 * Get the cue at a specific time.
 *
 * If multiple cues overlap at that time, only the first one will be returned.
 * If no cues are active at that time, undefined will be returned.
 *
 * @param doc The subtitle document to query.
 * @param timeMs The time in milliseconds to check for active cues.
 * @returns The cue active at the specified time, or undefined if none are active.
 */
export function getCueAt<T>(
  doc: SubtitleDocument<string, T>,
  timeMs: number,
): Cue<T> | undefined {
  return doc.cues.find((cue) => isCueAtTime(cue, timeMs));
}

/**
 * Get all cues at a specific time.
 *
 * - If multiple cues overlap at that time, all of them will be returned.
 * - If no cues are active at that time, an empty array will be returned.
 *
 * @param doc The subtitle document to query.
 * @param timeMs The time in milliseconds to check for active cues.
 * @returns An array of cues active at the specified time, or an empty array if none are active.
 */
export function getCuesAt<T>(
  doc: SubtitleDocument<string, T>,
  timeMs: number,
): Cue<T>[] {
  return doc.cues.filter((cue) => isCueAtTime(cue, timeMs));
}

/**
 * Get cues within a time range.
 *
 * - If includePartial is true, cues that partially overlap the range will be included.
 * - If includePartial is false, only cues that are fully contained within the range will be included.
 *
 * @param doc The subtitle document to query.
 * @param startMs The start time of the range in milliseconds.
 * @param endMs The end time of the range in milliseconds.
 * @param includePartial Whether to include cues that partially overlap the range (default: true).
 * @returns An array of cues that fall within the specified time range.
 */
export function getCuesInRange<T>(
  doc: SubtitleDocument<string, T>,
  startMs: number,
  endMs: number,
  includePartial = true,
): Cue<T>[] {
  return doc.cues.filter((cue) => {
    if (includePartial) {
      return cue.end.ms >= startMs && cue.start.ms <= endMs;
    }
    return cue.start.ms >= startMs && cue.end.ms <= endMs;
  });
}

/**
 * Get a cue by its ID.
 *
 * If a cue with the specified ID exists, it will be returned. Otherwise, undefined will be returned.
 *
 * @param doc The subtitle document to query.
 * @param id The ID of the cue to retrieve.
 * @returns The cue with the specified ID, or undefined if no such cue exists.
 */
export function getCueById<T>(
  doc: SubtitleDocument<string, T>,
  id: string,
): Cue<T> | undefined {
  return doc.cues.find((cue) => cue.id === id);
}

/**
 * Get the index of a cue by its ID.
 *
 * If a cue with the specified ID exists, its index will be returned. Otherwise, -1 will be returned.
 *
 * @param doc The subtitle document to query.
 * @param id The ID of the cue to find.
 * @returns The index of the cue with the specified ID, or -1 if no such cue exists.
 */
export function getCueIndex(doc: SubtitleDocument, id: string): number {
  return doc.cues.findIndex((cue) => cue.id === id);
}

/**
 * Find all pairs of overlapping cues.
 *
 * Two cues are considered overlapping if their time ranges intersect, meaning:
 * - Cue A starts before Cue B ends, and
 * - Cue A ends after Cue B starts.
 *
 * This function returns an array of pairs of cues that overlap. Each pair is represented as a tuple [CueA, CueB].
 * If no cues overlap, an empty array will be returned.
 *
 * @param doc The subtitle document to analyze for overlapping cues.
 * @returns An array of tuples, where each tuple contains two cues that overlap in time.
 */
export function findOverlappingCues<T>(
  doc: SubtitleDocument<string, T>,
): [Cue<T>, Cue<T>][] {
  const overlaps: [Cue<T>, Cue<T>][] = [];

  for (let i = 0; i < doc.cues.length; i++) {
    for (let j = i + 1; j < doc.cues.length; j++) {
      const a = doc.cues[i];
      const b = doc.cues[j];
      if (a.start.ms < b.end.ms && a.end.ms > b.start.ms) {
        overlaps.push([a, b]);
      }
    }
  }

  return overlaps;
}

/**
 * Check if document has any overlapping cues.
 *
 * Two cues are considered overlapping if their time ranges intersect, meaning:
 * - Cue A starts before Cue B ends, and
 * - Cue A ends after Cue B starts.
 *
 * @param doc The subtitle document to check for overlapping cues.
 * @returns True if there are any overlapping cues, false otherwise.
 */
export function hasOverlappingCues(doc: SubtitleDocument): boolean {
  for (let i = 0; i < doc.cues.length; i++) {
    for (let j = i + 1; j < doc.cues.length; j++) {
      const a = doc.cues[i];
      const b = doc.cues[j];
      if (a.start.ms < b.end.ms && a.end.ms > b.start.ms) {
        return true;
      }
    }
  }
  return false;
}
