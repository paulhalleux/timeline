import type { EditorTimedTextDocument, EditorTimedTextTrack } from "./editor-model";

/**
 * Create a normalized editor document.
 *
 * When no tracks are provided, the document starts with one empty subtitle
 * track so editor features have a stable target for cue insertion.
 *
 * @param input - Document id, format, optional tracks, and metadata.
 * @returns A complete editor document.
 *
 * @example
 * ```ts
 * const document = createEditorDocument({ format: "vtt" });
 * ```
 */
export function createEditorDocument(input: {
  id?: string;
  format: EditorTimedTextDocument["format"];
  tracks?: EditorTimedTextTrack[];
  metadata?: Record<string, unknown>;
}): EditorTimedTextDocument {
  return {
    id: input.id ?? generateId("doc"),
    format: input.format,
    tracks: input.tracks ?? [
      {
        id: generateId("track"),
        kind: "subtitle",
        cues: [],
      },
    ],
    metadata: input.metadata,
  };
}

/**
 * Return the document duration using the latest cue end time.
 *
 * @param document - Editor document to inspect.
 * @returns Duration in milliseconds, or `0` for an empty document.
 *
 * @example
 * ```ts
 * const durationMs = getEditorDocumentDuration(document);
 * ```
 */
export function getEditorDocumentDuration(document: EditorTimedTextDocument): number {
  const endTimes = document.tracks.flatMap((track) => track.cues.map((cue) => cue.endMs));
  return endTimes.length === 0 ? 0 : Math.max(...endTimes);
}

/**
 * Count cues across all tracks.
 *
 * @param document - Editor document to inspect.
 * @returns Total cue count.
 *
 * @example
 * ```ts
 * const total = getEditorCueCount(document);
 * ```
 */
export function getEditorCueCount(document: EditorTimedTextDocument): number {
  return document.tracks.reduce((total, track) => total + track.cues.length, 0);
}

/**
 * Deep-clone a document-like value.
 *
 * @typeParam TDocument - Document type being cloned.
 * @param document - Serializable document value.
 * @returns A structured clone of the input.
 *
 * @example
 * ```ts
 * const snapshot = cloneDocument(document);
 * ```
 */
export function cloneDocument<TDocument>(document: TDocument): TDocument {
  return structuredClone(document);
}

/**
 * Generate a prefixed random id.
 *
 * For deterministic tests or collaborative replay, prefer APIs that accept an
 * injected id factory instead of calling this function directly.
 *
 * @param prefix - Prefix to include before the generated UUID.
 * @returns A string in the form `${prefix}_${uuid}`.
 *
 * @example
 * ```ts
 * const cueId = generateId("cue");
 * ```
 */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
