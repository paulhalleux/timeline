import type {
  EditorTimedTextCue,
  EditorTimedTextDocument,
  EditorTimedTextTrack,
} from "../editor-model";

/**
 * Result returned when locating a track.
 *
 * @example
 * ```ts
 * const trackId = result?.track.id;
 * ```
 */
export interface TrackSearchResult {
  track: EditorTimedTextTrack;
  trackIndex: number;
}

/**
 * Result returned when locating a cue.
 *
 * @example
 * ```ts
 * const cueIndex = result?.cueIndex;
 * ```
 */
export interface CueSearchResult extends TrackSearchResult {
  cue: EditorTimedTextCue;
  cueIndex: number;
}

/**
 * Locate a track inside an editor document.
 *
 * @param document - Editor document to search.
 * @param trackId - Track id to find.
 * @returns Track and index when found, otherwise `undefined`.
 *
 * @example
 * ```ts
 * const result = findEditorTrack(document, "subtitles");
 * ```
 */
export function findEditorTrack(
  document: EditorTimedTextDocument,
  trackId: string,
): TrackSearchResult | undefined {
  const trackIndex = document.tracks.findIndex((track) => track.id === trackId);
  const track = document.tracks[trackIndex];
  return track ? { track, trackIndex } : undefined;
}

/**
 * Locate a cue across all tracks.
 *
 * @param document - Editor document to search.
 * @param cueId - Cue id to find.
 * @returns Cue, track, and indexes when found, otherwise `undefined`.
 *
 * @example
 * ```ts
 * const result = findEditorCue(document, "cue-1");
 * ```
 */
export function findEditorCue(
  document: EditorTimedTextDocument,
  cueId: string,
): CueSearchResult | undefined {
  for (let trackIndex = 0; trackIndex < document.tracks.length; trackIndex++) {
    const track = document.tracks[trackIndex];
    const cueIndex = track.cues.findIndex((cue) => cue.id === cueId);
    const cue = track.cues[cueIndex];
    if (cue) return { track, trackIndex, cue, cueIndex };
  }

  return undefined;
}

/**
 * Replace one track without touching the rest of the document.
 *
 * @param document - Editor document to update.
 * @param trackId - Track id to replace.
 * @param track - Replacement track.
 * @returns A new document with the replacement track.
 *
 * @example
 * ```ts
 * const next = replaceEditorTrack(document, track.id, {
 *   ...track,
 *   cues: [],
 * });
 * ```
 */
export function replaceEditorTrack(
  document: EditorTimedTextDocument,
  trackId: string,
  track: EditorTimedTextTrack,
): EditorTimedTextDocument {
  return {
    ...document,
    tracks: document.tracks.map((candidate) =>
      candidate.id === trackId ? track : candidate,
    ),
  };
}

/**
 * Insert an item into an array without mutating the input.
 *
 * @typeParam T - Item type.
 * @param items - Source array.
 * @param index - Insertion index.
 * @param item - Item to insert.
 * @returns A new array with the item inserted.
 *
 * @example
 * ```ts
 * const next = insertAt(["a", "c"], 1, "b");
 * ```
 */
export function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  return [...items.slice(0, index), item, ...items.slice(index)];
}

/**
 * Clamp an array index to a valid insertion range.
 *
 * @param index - Requested index.
 * @param length - Array length.
 * @returns A number between `0` and `length`.
 *
 * @example
 * ```ts
 * const index = clampIndex(requestedIndex, cues.length);
 * ```
 */
export function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

/**
 * Split plain text near its midpoint, preferring a word boundary.
 *
 * @param text - Text to split.
 * @returns Tuple containing first and second text fragments.
 *
 * @example
 * ```ts
 * const [first, second] = splitPlainText("Hello world");
 * ```
 */
export function splitPlainText(text: string): [string, string] {
  const midpoint = Math.floor(text.length / 2);
  const previousSpace = text.lastIndexOf(" ", midpoint);
  const nextSpace = text.indexOf(" ", midpoint);
  const splitPoint =
    previousSpace !== -1
      ? previousSpace
      : nextSpace !== -1
        ? nextSpace
        : midpoint;

  return [text.slice(0, splitPoint).trim(), text.slice(splitPoint).trim()];
}
