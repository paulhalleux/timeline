import type { Cue, CueInput, SubtitleDocument } from "../types";
import { createCue, time } from "../utils";

/**
 * Map over all cues in a document.
 *
 * The provided function will be called for each cue, and should return a new cue object.
 * This allows you to transform cues in any way you like, such as changing their timing, content, or metadata.
 *
 * @param doc The subtitle document to map cues in.
 * @param fn A function that takes a cue and its index, and returns a new cue object.
 * @returns A new document with cues transformed by the provided function.
 */
export function mapCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  fn: (cue: Cue<TMetadata>, index: number) => Cue<TMetadata>,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: doc.cues.map(fn),
  };
}

/**
 * Filter cues in a document.
 *
 * Cues for which the predicate returns false will be removed from the document.
 *
 * @param doc The subtitle document to filter cues in.
 * @param predicate A function that takes a cue and its index, and returns true to keep the cue or false to remove it.
 * @returns A new document with only the cues for which the predicate returned true.
 */
export function filterCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  predicate: (cue: Cue<TMetadata>, index: number) => boolean,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: doc.cues.filter(predicate),
  };
}

/**
 * Sort cues by start time.
 *
 * @param doc The subtitle document to sort cues in.
 * @returns A new document with cues sorted by start time.
 */
export function sortCuesByTime<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: [...doc.cues].sort((a, b) => a.start.ms - b.start.ms),
  };
}

/**
 * Add a cue to the document.
 *
 * The new cue will be appended to the end of the cues array. If you want to insert it at a specific position, you can use `mapCues` or `filterCues` to achieve that.
 *
 * @param doc The subtitle document to add the cue to.
 * @param cue The cue input to create and add to the document.
 * @returns A new document with the added cue.
 */
export function addCue<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  cue: CueInput<TMetadata>,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: [...doc.cues, createCue(cue)],
  };
}

/**
 * Remove a cue by ID.
 *
 * @param doc The subtitle document to remove the cue from.
 * @param cueId The ID of the cue to remove.
 * @returns A new document with the specified cue removed.
 */
export function removeCue<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  cueId: string,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: doc.cues.filter((c) => c.id !== cueId),
  };
}

/**
 * Remove multiple cues by ID.
 *
 * @param doc The subtitle document to remove cues from.
 * @param cueIds An array of cue IDs to remove from the document.
 * @returns A new document with the specified cues removed.
 */
export function removeCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  cueIds: string[],
): SubtitleDocument<TFormat, TMetadata> {
  const idSet = new Set(cueIds);
  return {
    ...doc,
    cues: doc.cues.filter((c) => !idSet.has(c.id)),
  };
}

/**
 * Update a cue by ID.
 *
 * Only the provided fields in `updates` will be changed; other fields will remain the same.
 * The `id` field cannot be updated to ensure cue identity is preserved.
 *
 * @param doc The subtitle document containing the cue to update.
 * @param cueId The ID of the cue to update.
 * @param updates An object containing the fields to update on the cue.
 * @returns A new document with the updated cue.
 */
export function updateCue<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  cueId: string,
  updates: Partial<Omit<Cue<TMetadata>, "id">>,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: doc.cues.map((c) => (c.id === cueId ? { ...c, ...updates } : c)),
  };
}

/**
 * Shift timing of specific cues or all cues.
 *
 * If `cueIds` is provided, only cues with those IDs will be shifted. Otherwise, all cues will be shifted.
 *
 * @param doc The subtitle document to shift cues in.
 * @param offsetMs The amount of time in milliseconds to shift cues (positive or negative).
 * @param cueIds Optional array of cue IDs to shift. If omitted, all cues will be shifted.
 * @returns A new document with shifted cue timings.
 */
export function shiftCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  offsetMs: number,
  cueIds?: string[],
): SubtitleDocument<TFormat, TMetadata> {
  const idSet = cueIds ? new Set(cueIds) : null;

  return {
    ...doc,
    cues: doc.cues.map((c) => {
      if (idSet && !idSet.has(c.id)) return c;
      return {
        ...c,
        start: time(Math.max(0, c.start.ms + offsetMs)),
        end: time(Math.max(0, c.end.ms + offsetMs)),
      };
    }),
  };
}

/**
 * Scale timing of cues by a factor, optionally anchored around a specific time.
 *
 * For example, to double the speed of subtitles, use a factor of 0.5.
 * To slow down by 50%, use a factor of 2.
 *
 * @param doc The subtitle document to scale cues in.
 * @param factor The scaling factor (e.g., 0.5 to double speed, 2 to slow down).
 * @param anchorMs Optional anchor time in milliseconds to scale around (default is 0).
 * @returns A new document with scaled cue timings.
 */
export function scaleCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  factor: number,
  anchorMs = 0,
): SubtitleDocument<TFormat, TMetadata> {
  if (factor <= 0) return doc;

  return {
    ...doc,
    cues: doc.cues.map((c) => ({
      ...c,
      start: time(anchorMs + (c.start.ms - anchorMs) * factor),
      end: time(anchorMs + (c.end.ms - anchorMs) * factor),
    })),
  };
}

/**
 * Clear all cues from the document.
 *
 * This can be useful for resetting a document while keeping metadata and format intact.
 *
 * @param doc The subtitle document to clear cues from.
 * @returns A new document with the same format and metadata but no cues.
 */
export function clearCues<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
): SubtitleDocument<TFormat, TMetadata> {
  return {
    ...doc,
    cues: [],
  };
}
