import { generateId } from "../document";
import type { EditorTimedTextCue, EditorTimedTextDocument } from "../editor-model";
import type { EditorOperationResult } from "./results";
import { operationFailure, operationSuccess } from "./results";
import { clampIndex, findEditorCue, findEditorTrack, insertAt } from "./utils";

/**
 * Input accepted by {@link createEditorCue}.
 *
 * @example
 * ```ts
 * const input: CreateEditorCueInput = {
 *   startMs: 0,
 *   endMs: 1_000,
 *   text: "Hello",
 * };
 * ```
 */
export interface CreateEditorCueInput {
  id?: string;
  startMs: number;
  endMs: number;
  text?: string;
  speaker?: string;
  tags?: EditorTimedTextCue["tags"];
  style?: EditorTimedTextCue["style"];
  metadata?: EditorTimedTextCue["metadata"];
}

/**
 * Metadata returned after inserting an editor cue.
 *
 * @example
 * ```ts
 * const insertedCue = result.ok ? result.data.cue : undefined;
 * ```
 */
export interface InsertEditorCueData {
  trackId: string;
  cue: EditorTimedTextCue;
  index: number;
}

/**
 * Metadata returned after deleting an editor cue.
 *
 * @example
 * ```ts
 * const originalIndex = result.ok ? result.data.index : -1;
 * ```
 */
export interface DeleteEditorCueData {
  trackId: string;
  cue: EditorTimedTextCue;
  index: number;
}

/**
 * Metadata returned after updating an editor cue.
 *
 * @example
 * ```ts
 * if (result.ok) {
 *   history.push(result.data.previousCue);
 * }
 * ```
 */
export interface UpdateEditorCueData {
  trackId: string;
  previousCue: EditorTimedTextCue;
  cue: EditorTimedTextCue;
  index: number;
}

/**
 * Create a normalized editor cue for the editor document model.
 *
 * The optional `createId` dependency makes this helper deterministic in tests
 * and collaboration replay while still allowing production callers to use the
 * default random id generator.
 *
 * @param input - Cue fields to normalize into an editor cue.
 * @param createId - Optional id factory used when `input.id` is omitted.
 * @returns A complete editor cue with an id and text value.
 *
 * @example
 * ```ts
 * const cue = createEditorCue(
 *   { startMs: 1_000, endMs: 2_500, text: "Hello" },
 *   () => "cue-1",
 * );
 * ```
 */
export function createEditorCue(
  input: CreateEditorCueInput,
  createId: (prefix: string) => string = generateId,
): EditorTimedTextCue {
  return {
    id: input.id ?? createId("cue"),
    startMs: input.startMs,
    endMs: input.endMs,
    text: input.text ?? "",
    speaker: input.speaker,
    tags: input.tags,
    style: input.style,
    metadata: input.metadata,
  };
}

/**
 * Map over all cues in every track.
 *
 * @param document - Editor document to transform.
 * @param mapper - Pure callback that receives each cue, cue index, and track id.
 * @returns A new document with mapped cues.
 *
 * @example
 * ```ts
 * const uppercased = mapEditorCues(document, (cue) => ({
 *   ...cue,
 *   text: cue.text.toUpperCase(),
 * }));
 * ```
 */
export function mapEditorCues(
  document: EditorTimedTextDocument,
  mapper: (cue: EditorTimedTextCue, cueIndex: number, trackId: string) => EditorTimedTextCue,
): EditorTimedTextDocument {
  return {
    ...document,
    tracks: document.tracks.map((track) => ({
      ...track,
      cues: track.cues.map((cue, cueIndex) => mapper(cue, cueIndex, track.id)),
    })),
  };
}

/**
 * Filter cues in every track.
 *
 * @param document - Editor document to transform.
 * @param predicate - Callback that returns `true` for cues to keep.
 * @returns A new document containing only matching cues.
 *
 * @example
 * ```ts
 * const visible = filterEditorCues(document, (cue) => cue.endMs > playheadMs);
 * ```
 */
export function filterEditorCues(
  document: EditorTimedTextDocument,
  predicate: (cue: EditorTimedTextCue, cueIndex: number, trackId: string) => boolean,
): EditorTimedTextDocument {
  return {
    ...document,
    tracks: document.tracks.map((track) => ({
      ...track,
      cues: track.cues.filter((cue, cueIndex) => predicate(cue, cueIndex, track.id)),
    })),
  };
}

/**
 * Sort cues by start time in each track.
 *
 * @param document - Editor document whose tracks should be sorted.
 * @returns A new document with each track's cues ordered by `startMs`.
 *
 * @example
 * ```ts
 * const ordered = sortEditorCuesByTime(document);
 * ```
 */
export function sortEditorCuesByTime(document: EditorTimedTextDocument): EditorTimedTextDocument {
  return {
    ...document,
    tracks: document.tracks.map((track) => ({
      ...track,
      cues: [...track.cues].sort((a, b) => a.startMs - b.startMs),
    })),
  };
}

/**
 * Insert a cue into a track.
 *
 * @param document - Editor document to update.
 * @param trackId - Track that should receive the cue.
 * @param cue - Fully normalized cue to insert.
 * @param index - Optional insertion index. Out-of-range values are clamped.
 * @returns An operation result containing the updated document and insertion metadata.
 *
 * @example
 * ```ts
 * const cue = createEditorCue({ id: "cue-1", startMs: 0, endMs: 1_000 });
 * const result = insertEditorCue(document, "subtitles", cue, 0);
 *
 * if (result.ok) {
 *   console.log(result.data.index);
 * }
 * ```
 */
export function insertEditorCue(
  document: EditorTimedTextDocument,
  trackId: string,
  cue: EditorTimedTextCue,
  index?: number,
): EditorOperationResult<InsertEditorCueData> {
  const trackResult = findEditorTrack(document, trackId);
  if (!trackResult) {
    return operationFailure(document, {
      code: "track.not-found",
      message: "Cannot insert cue because the track does not exist.",
      trackId,
    });
  }

  if (findEditorCue(document, cue.id)) {
    return operationFailure(document, {
      code: "cue.duplicate-id",
      message: "Cannot insert cue because a cue with that id already exists.",
      cueId: cue.id,
    });
  }

  const insertionIndex = clampIndex(
    index ?? trackResult.track.cues.length,
    trackResult.track.cues.length,
  );
  const nextDocument = {
    ...document,
    tracks: document.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            cues: insertAt(track.cues, insertionIndex, cue),
          }
        : track,
    ),
  };

  return operationSuccess(nextDocument, {
    trackId,
    cue,
    index: insertionIndex,
  });
}

/**
 * Remove a cue by id.
 *
 * @param document - Editor document to update.
 * @param cueId - Cue id to remove from whichever track contains it.
 * @returns An operation result containing the removed cue and its original location.
 *
 * @example
 * ```ts
 * const result = deleteEditorCue(document, "cue-1");
 * const removedCue = result.ok ? result.data.cue : undefined;
 * ```
 */
export function deleteEditorCue(
  document: EditorTimedTextDocument,
  cueId: string,
): EditorOperationResult<DeleteEditorCueData> {
  const cueResult = findEditorCue(document, cueId);
  if (!cueResult) {
    return operationFailure(document, {
      code: "cue.not-found",
      message: "Cannot delete cue because it does not exist.",
      cueId,
    });
  }

  const nextDocument = {
    ...document,
    tracks: document.tracks.map((track) =>
      track.id === cueResult.track.id
        ? {
            ...track,
            cues: track.cues.filter((cue) => cue.id !== cueId),
          }
        : track,
    ),
  };

  return operationSuccess(nextDocument, {
    trackId: cueResult.track.id,
    cue: cueResult.cue,
    index: cueResult.cueIndex,
  });
}

/**
 * Replace one cue while preserving its identity.
 *
 * The `id` field is intentionally excluded from updates so helpers and command
 * history can rely on stable cue identity.
 *
 * @param document - Editor document to update.
 * @param cueId - Cue id to update.
 * @param updates - Partial cue fields to merge into the existing cue.
 * @returns An operation result containing the previous and updated cue.
 *
 * @example
 * ```ts
 * const result = updateEditorCue(document, "cue-1", { text: "Revised" });
 * ```
 */
export function updateEditorCue(
  document: EditorTimedTextDocument,
  cueId: string,
  updates: Partial<Omit<EditorTimedTextCue, "id">>,
): EditorOperationResult<UpdateEditorCueData> {
  const cueResult = findEditorCue(document, cueId);
  if (!cueResult) {
    return operationFailure(document, {
      code: "cue.not-found",
      message: "Cannot update cue because it does not exist.",
      cueId,
    });
  }

  const nextCue = { ...cueResult.cue, ...updates };
  const nextDocument = {
    ...document,
    tracks: document.tracks.map((track) =>
      track.id === cueResult.track.id
        ? {
            ...track,
            cues: track.cues.map((cue) => (cue.id === cueId ? nextCue : cue)),
          }
        : track,
    ),
  };

  return operationSuccess(nextDocument, {
    trackId: cueResult.track.id,
    previousCue: cueResult.cue,
    cue: nextCue,
    index: cueResult.cueIndex,
  });
}

/**
 * Remove all cues while preserving document and track metadata.
 *
 * @param document - Editor document to clear.
 * @returns A new document whose tracks contain no cues.
 *
 * @example
 * ```ts
 * const emptyDocument = clearEditorCues(document);
 * ```
 */
export function clearEditorCues(document: EditorTimedTextDocument): EditorTimedTextDocument {
  return {
    ...document,
    tracks: document.tracks.map((track) => ({ ...track, cues: [] })),
  };
}
