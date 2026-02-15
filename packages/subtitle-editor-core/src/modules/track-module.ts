import { type CoreApi, Store } from "@ptl/modular-core";
import { SubtitleParser, type SupportedFormats } from "@ptl/subtitle-kit";

import type { EditorModule } from "../editor-module";
import type { EntityId, SubtitleTrack } from "../types";
import { generateId } from "../utils";
import type { HistoryModule } from "./history-module";

// ============================================================================
// Track Module Options
// ============================================================================

export interface TrackModuleOptions {
  /** Optional history module for auto-recording changes */
  history?: HistoryModule | null;
}

// ============================================================================
// Track Module State
// ============================================================================

export interface TrackModuleState {
  tracks: SubtitleTrack[];
}

const createInitialState = (): TrackModuleState => ({
  tracks: [],
});

// ============================================================================
// Track Module API
// ============================================================================

export interface TrackModuleApi {
  // Store Access
  getStore(): Store<TrackModuleState>;
  getState(): TrackModuleState;
  getTracks(): SubtitleTrack[];

  // Track Operations
  loadFile(file: File): Promise<SubtitleTrack>;
  parseAndAdd(filename: string, content: string): SubtitleTrack;
  add(track: SubtitleTrack): void;
  remove(trackId: EntityId): SubtitleTrack | null;
  get(trackId: EntityId): SubtitleTrack | undefined;
  update(trackId: EntityId, updates: Partial<Omit<SubtitleTrack, "id">>): void;
  export(trackId: EntityId): string | null;
  clear(): void;
  destroy(): void;

  // Cue Access
  getCue(
    trackId: EntityId,
    cueId: string,
  ): ReturnType<SubtitleTrack["document"]["getCues"]>[number] | undefined;
  getCueByIndex(
    trackId: EntityId,
    cueIndex: number,
  ): ReturnType<SubtitleTrack["document"]["getCues"]>[number] | undefined;
  getCuesAt(
    trackId: EntityId,
    timeMs: number,
  ): ReturnType<SubtitleTrack["document"]["getCues"]>;
  getCuesInRange(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    includePartial?: boolean,
  ): ReturnType<SubtitleTrack["document"]["getCues"]>;

  // Cue CRUD Operations
  updateCue(
    trackId: EntityId,
    cueId: string,
    updates: { text?: string; startMs?: number; endMs?: number },
  ): void;
  deleteCue(trackId: EntityId, cueId: string): void;
  deleteCues(trackId: EntityId, cueIds: string[]): void;
  insertCue(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    text: string,
    atIndex?: number,
  ): string | null;

  // Advanced Cue Operations
  splitCue(
    trackId: EntityId,
    cueId: string,
    splitTimeMs: number,
    textDistribution?: "first" | "second" | "both" | "split",
  ): string | null;
  duplicateCue(
    trackId: EntityId,
    cueId: string,
    insertAfter?: boolean,
  ): string | null;
  mergeCues(
    trackId: EntityId,
    cueId1: string,
    cueId2: string,
    textCombination?: "concat" | "space" | "first" | "second",
  ): boolean;

  // Timing Operations
  shiftCues(
    trackId: EntityId,
    offsetMs: number,
    cueIds?: string[] | null,
  ): void;
  scaleCues(trackId: EntityId, factor: number, anchorMs?: number): void;

  // Document Operations
  sortCuesByTime(trackId: EntityId): void;
  fixOverlaps(trackId: EntityId, mode?: "trim" | "remove"): void;
  getOverlappingCues(
    trackId: EntityId,
  ): ReturnType<SubtitleTrack["document"]["getOverlappingCues"]>;
}

// ============================================================================
// Track Module
// ============================================================================

/**
 * Module for managing subtitle tracks.
 * Handles loading, parsing, and CRUD operations for subtitle files.
 */
export class TrackModule implements EditorModule<TrackModuleApi> {
  static id = "TrackModule";

  private readonly store: Store<TrackModuleState>;
  private readonly history: HistoryModule | null;

  constructor(options: TrackModuleOptions = {}) {
    this.store = new Store<TrackModuleState>(createInitialState());
    this.history = options.history ?? null;
  }

  // Static Methods

  static for<A>(editor: CoreApi<A>): TrackModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(): void {}
  detach(): void {}

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<TrackModuleState> {
    return this.store;
  }

  getState(): TrackModuleState {
    return this.store.get();
  }

  getTracks(): SubtitleTrack[] {
    return this.getState().tracks;
  }

  // ---------------------------------------------------------------------------
  // Track Operations
  // ---------------------------------------------------------------------------

  /**
   * Detects subtitle format from file extension.
   */
  private detectFormat(filename: string): SupportedFormats {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "srt":
        return "srt";
      case "vtt":
      case "webvtt":
        return "vtt";
      default:
        return "vtt";
    }
  }

  /**
   * Loads a subtitle file and adds it as a track.
   */
  loadFile(file: File): Promise<SubtitleTrack> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") {
          reject(new Error("Failed to read subtitle file"));
          return;
        }

        try {
          const track = this.parseAndAdd(file.name, text);
          resolve(track);
        } catch (error) {
          reject(new Error(`Failed to parse subtitle file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read subtitle file"));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Parses subtitle content and adds it as a track.
   */
  parseAndAdd(filename: string, content: string): SubtitleTrack {
    const format = this.detectFormat(filename);
    const document = SubtitleParser.parse(format, content);

    const track: SubtitleTrack = {
      id: generateId("track"),
      label: filename,
      document,
    };

    this.add(track);
    return track;
  }

  /**
   * Adds a track to the store.
   */
  add(track: SubtitleTrack): void {
    const { tracks } = this.getState();
    this.store.set({ tracks: [...tracks, track] });
  }

  /**
   * Removes a track by ID.
   */
  remove(trackId: EntityId): SubtitleTrack | null {
    const { tracks } = this.getState();
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return null;

    this.store.set({
      tracks: tracks.filter((t) => t.id !== trackId),
    });

    return track;
  }

  /**
   * Gets a track by ID.
   */
  get(trackId: EntityId): SubtitleTrack | undefined {
    return this.getState().tracks.find((t) => t.id === trackId);
  }

  /**
   * Updates a track.
   */
  update(trackId: EntityId, updates: Partial<Omit<SubtitleTrack, "id">>): void {
    const { tracks } = this.getState();
    this.store.set({
      tracks: tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
    });
  }

  // ---------------------------------------------------------------------------
  // Cue Operations
  // ---------------------------------------------------------------------------

  /**
   * Gets a cue by its unique ID from a track.
   */
  getCue(trackId: EntityId, cueId: string) {
    const track = this.get(trackId);
    if (!track) return undefined;
    return track.document.getCueById(cueId) ?? undefined;
  }

  /**
   * Gets a cue by index from a track.
   * @deprecated Prefer using getCue with cue ID for stability
   */
  getCueByIndex(trackId: EntityId, cueIndex: number) {
    const track = this.get(trackId);
    if (!track) return undefined;
    return track.document.getCueByIndex(cueIndex) ?? undefined;
  }

  /**
   * Gets all cues active at a specific time.
   */
  getCuesAt(trackId: EntityId, timeMs: number) {
    const track = this.get(trackId);
    if (!track) return [];
    return track.document.getAllAt(timeMs);
  }

  /**
   * Gets all cues within a time range.
   */
  getCuesInRange(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    includePartial: boolean = true,
  ) {
    const track = this.get(trackId);
    if (!track) return [];
    return track.document.getCuesInRange(startMs, endMs, includePartial);
  }

  /**
   * Updates a cue in a track.
   */
  updateCue(
    trackId: EntityId,
    cueId: string,
    updates: {
      text?: string;
      startMs?: number;
      endMs?: number;
    },
  ): void {
    const track = this.get(trackId);
    if (!track) return;

    // Get cue by ID
    const cue = this.getCue(trackId, cueId);
    if (!cue) return;

    // Capture old values for history
    const oldValues: { text?: string; startMs?: number; endMs?: number } = {};
    if (updates.text !== undefined) oldValues.text = cue.text;
    if (updates.startMs !== undefined)
      oldValues.startMs = cue.start.milliseconds;
    if (updates.endMs !== undefined) oldValues.endMs = cue.end.milliseconds;

    const cueUpdates: Record<string, unknown> = {};

    if (updates.text !== undefined) {
      cueUpdates.text = updates.text;
    }

    if (updates.startMs !== undefined) {
      cueUpdates.start = {
        raw: this.formatTimestamp(updates.startMs),
        milliseconds: updates.startMs,
      };
    }

    if (updates.endMs !== undefined) {
      cueUpdates.end = {
        raw: this.formatTimestamp(updates.endMs),
        milliseconds: updates.endMs,
      };
    }

    track.document.update(cue.index, cueUpdates);

    // Trigger store update to notify subscribers
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:update",
        description: `Update cue ${cueId}`,
        undo: () => this.updateCueInternal(trackId, cueId, oldValues),
        redo: () => this.updateCueInternal(trackId, cueId, updates),
      });
    }
  }

  /**
   * Internal cue update that doesn't record to history.
   */
  private updateCueInternal(
    trackId: EntityId,
    cueId: string,
    updates: { text?: string; startMs?: number; endMs?: number },
  ): void {
    const track = this.get(trackId);
    if (!track) return;

    const cue = this.getCue(trackId, cueId);
    if (!cue) return;

    const cueUpdates: Record<string, unknown> = {};
    if (updates.text !== undefined) cueUpdates.text = updates.text;
    if (updates.startMs !== undefined) {
      cueUpdates.start = {
        raw: this.formatTimestamp(updates.startMs),
        milliseconds: updates.startMs,
      };
    }
    if (updates.endMs !== undefined) {
      cueUpdates.end = {
        raw: this.formatTimestamp(updates.endMs),
        milliseconds: updates.endMs,
      };
    }

    track.document.update(cue.index, cueUpdates);
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Formats milliseconds to a timestamp string (HH:MM:SS.mmm).
   */
  private formatTimestamp(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
  }

  /**
   * Deletes a cue from a track.
   */
  deleteCue(trackId: EntityId, cueId: string): void {
    const track = this.get(trackId);
    if (!track) return;

    // Get cue by ID
    const cue = this.getCue(trackId, cueId);
    if (!cue) return;

    // Capture cue data for history
    const deletedCueData = {
      id: cue.id,
      text: cue.text,
      startMs: cue.start.milliseconds,
      endMs: cue.end.milliseconds,
      index: cue.index,
    };

    track.document.remove(cue.index);

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:delete",
        description: `Delete cue ${cueId}`,
        undo: () =>
          this.insertCueInternal(
            trackId,
            deletedCueData.startMs,
            deletedCueData.endMs,
            deletedCueData.text,
            deletedCueData.index,
            deletedCueData.id,
          ),
        redo: () => this.deleteCueInternal(trackId, cueId),
      });
    }
  }

  /**
   * Internal delete that doesn't record to history.
   */
  private deleteCueInternal(trackId: EntityId, cueId: string): void {
    const track = this.get(trackId);
    if (!track) return;
    const cue = this.getCue(trackId, cueId);
    if (!cue) return;
    track.document.remove(cue.index);
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Inserts a new cue into a track.
   * @returns The ID of the inserted cue, or null if insertion failed.
   */
  insertCue(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    text: string,
    atIndex?: number,
  ): string | null {
    const track = this.get(trackId);
    if (!track) return null;

    // Determine the actual index where cue will be inserted
    const insertIndex = atIndex ?? track.document.getCues().length;

    track.document.insert({
      start: { raw: this.formatTimestamp(startMs), milliseconds: startMs },
      end: { raw: this.formatTimestamp(endMs), milliseconds: endMs },
      text,
      index: atIndex,
    });

    // Get the inserted cue to retrieve its ID
    const insertedCue = track.document.getCueByIndex(insertIndex);
    const insertedCueId = insertedCue?.id ?? null;

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing() && insertedCueId) {
      this.history.record({
        type: "cue:insert",
        description: `Insert cue at ${insertIndex}`,
        undo: () => this.deleteCueInternal(trackId, insertedCueId),
        redo: () =>
          this.insertCueInternal(
            trackId,
            startMs,
            endMs,
            text,
            insertIndex,
            insertedCueId,
          ),
      });
    }

    return insertedCueId;
  }

  /**
   * Internal insert that doesn't record to history.
   */
  private insertCueInternal(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    text: string,
    atIndex?: number,
    withId?: string,
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    track.document.insert({
      start: { raw: this.formatTimestamp(startMs), milliseconds: startMs },
      end: { raw: this.formatTimestamp(endMs), milliseconds: endMs },
      text,
      index: atIndex,
      id: withId,
    });
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Deletes multiple cues from a track.
   */
  deleteCues(trackId: EntityId, cueIds: string[]): void {
    const track = this.get(trackId);
    if (!track) return;

    // Capture cue data for history
    const deletedCuesData = cueIds
      .map((id) => {
        const cue = this.getCue(trackId, id);
        return cue
          ? {
              id: cue.id,
              index: cue.index,
              text: cue.text,
              startMs: cue.start.milliseconds,
              endMs: cue.end.milliseconds,
            }
          : null;
      })
      .filter((c) => c !== null);

    // Get indices and remove in reverse order to maintain correct indices
    const indices = deletedCuesData.map((c) => c.index).sort((a, b) => b - a);

    for (const index of indices) {
      track.document.remove(index);
    }

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (
      this.history &&
      !this.history.isUndoingOrRedoing() &&
      deletedCuesData.length > 0
    ) {
      this.history.record({
        type: "cue:delete-many",
        description: `Delete ${deletedCuesData.length} cues`,
        undo: () => {
          // Re-insert in original index order
          const sortedByIndex = [...deletedCuesData].sort(
            (a, b) => a.index - b.index,
          );
          for (const cueData of sortedByIndex) {
            this.insertCueInternal(
              trackId,
              cueData.startMs,
              cueData.endMs,
              cueData.text,
              cueData.index,
              cueData.id,
            );
          }
        },
        redo: () => this.deleteCuesInternal(trackId, cueIds),
      });
    }
  }

  /**
   * Internal delete multiple cues that doesn't record to history.
   */
  private deleteCuesInternal(trackId: EntityId, cueIds: string[]): void {
    const track = this.get(trackId);
    if (!track) return;

    // Get indices and remove in reverse order
    const indices = cueIds
      .map((id) => this.getCue(trackId, id)?.index)
      .filter((idx): idx is number => idx !== undefined)
      .sort((a, b) => b - a);

    for (const index of indices) {
      track.document.remove(index);
    }

    this.store.set({ tracks: [...this.getState().tracks] });
  }

  // ---------------------------------------------------------------------------
  // Advanced Cue Operations
  // ---------------------------------------------------------------------------

  /**
   * Splits a cue at a specific time point into two cues.
   * @returns The ID of the newly created second cue, or null if split failed.
   */
  splitCue(
    trackId: EntityId,
    cueId: string,
    splitTimeMs: number,
    textDistribution: "first" | "second" | "both" | "split" = "both",
  ): string | null {
    const track = this.get(trackId);
    if (!track) return null;

    // Get cue by ID
    const cue = this.getCue(trackId, cueId);
    if (!cue) return null;

    // Capture cue data for history
    const originalCueData = {
      id: cue.id,
      text: cue.text,
      startMs: cue.start.milliseconds,
      endMs: cue.end.milliseconds,
    };

    const success = track.document.split(cue.index, {
      splitTime: splitTimeMs,
      textDistribution,
    });

    if (!success) return null;

    // Get the new second cue (it's at original index + 1)
    const secondCue = track.document.getCueByIndex(cue.index + 1);
    const secondCueId = secondCue?.id ?? null;

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing() && secondCueId) {
      this.history.record({
        type: "cue:split",
        description: `Split cue ${cueId}`,
        undo: () => {
          // Delete the second cue and restore the first
          this.deleteCueInternal(trackId, secondCueId);
          this.updateCueInternal(trackId, cueId, {
            text: originalCueData.text,
            startMs: originalCueData.startMs,
            endMs: originalCueData.endMs,
          });
        },
        redo: () => {
          this.splitCueInternal(trackId, cueId, splitTimeMs, textDistribution);
        },
      });
    }

    return secondCueId;
  }

  /**
   * Internal split that doesn't record to history.
   */
  private splitCueInternal(
    trackId: EntityId,
    cueId: string,
    splitTimeMs: number,
    textDistribution: "first" | "second" | "both" | "split",
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    const cue = this.getCue(trackId, cueId);
    if (!cue) return;
    track.document.split(cue.index, {
      splitTime: splitTimeMs,
      textDistribution,
    });
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Duplicates a cue.
   * @returns The ID of the duplicated cue, or null if duplication failed.
   */
  duplicateCue(
    trackId: EntityId,
    cueId: string,
    insertAfter: boolean = true,
  ): string | null {
    const track = this.get(trackId);
    if (!track) return null;

    // Get cue by ID
    const cue = this.getCue(trackId, cueId);
    if (!cue) return null;

    const newIndex = track.document.duplicate(cue.index, insertAfter);

    if (newIndex === null) return null;

    // Get the new cue to retrieve its ID
    const newCue = track.document.getCueByIndex(newIndex);
    const newCueId = newCue?.id ?? null;

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing() && newCueId) {
      this.history.record({
        type: "cue:duplicate",
        description: `Duplicate cue ${cueId}`,
        undo: () => this.deleteCueInternal(trackId, newCueId),
        redo: () => this.duplicateCueInternal(trackId, cueId, insertAfter),
      });
    }

    return newCueId;
  }

  /**
   * Internal duplicate that doesn't record to history.
   */
  private duplicateCueInternal(
    trackId: EntityId,
    cueId: string,
    insertAfter: boolean,
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    const cue = this.getCue(trackId, cueId);
    if (!cue) return;
    track.document.duplicate(cue.index, insertAfter);
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Merges two cues into one.
   */
  mergeCues(
    trackId: EntityId,
    cueId1: string,
    cueId2: string,
    textCombination: "concat" | "space" | "first" | "second" = "concat",
  ): boolean {
    const track = this.get(trackId);
    if (!track) return false;

    // Get cues by ID
    const cue1 = this.getCue(trackId, cueId1);
    const cue2 = this.getCue(trackId, cueId2);
    if (!cue1 || !cue2) return false;

    // Capture cue data for history
    const cue1Data = {
      id: cue1.id,
      text: cue1.text,
      startMs: cue1.start.milliseconds,
      endMs: cue1.end.milliseconds,
    };
    const cue2Data = {
      id: cue2.id,
      index: cue2.index,
      text: cue2.text,
      startMs: cue2.start.milliseconds,
      endMs: cue2.end.milliseconds,
    };

    const success = track.document.merge(cue1.index, cue2.index, {
      textCombination,
    });

    if (!success) return false;

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:merge",
        description: `Merge cues ${cueId1} and ${cueId2}`,
        undo: () => {
          // Restore the first cue and re-insert the second
          this.updateCueInternal(trackId, cueId1, {
            text: cue1Data.text,
            startMs: cue1Data.startMs,
            endMs: cue1Data.endMs,
          });
          this.insertCueInternal(
            trackId,
            cue2Data.startMs,
            cue2Data.endMs,
            cue2Data.text,
            cue2Data.index,
            cue2Data.id,
          );
        },
        redo: () => {
          this.mergeCuesInternal(trackId, cueId1, cueId2, textCombination);
        },
      });
    }

    return true;
  }

  /**
   * Internal merge that doesn't record to history.
   */
  private mergeCuesInternal(
    trackId: EntityId,
    cueId1: string,
    cueId2: string,
    textCombination: "concat" | "space" | "first" | "second",
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    const cue1 = this.getCue(trackId, cueId1);
    const cue2 = this.getCue(trackId, cueId2);
    if (!cue1 || !cue2) return;
    track.document.merge(cue1.index, cue2.index, { textCombination });
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  // ---------------------------------------------------------------------------
  // Timing Operations
  // ---------------------------------------------------------------------------

  /**
   * Shifts the timing of cues by an offset.
   */
  shiftCues(
    trackId: EntityId,
    offsetMs: number,
    cueIds: string[] | null = null,
  ): void {
    const track = this.get(trackId);
    if (!track) return;

    // Capture original timings for history
    const targetCues =
      cueIds !== null
        ? cueIds
            .map((id) => this.getCue(trackId, id))
            .filter((c) => c !== undefined)
        : track.document.getCues();

    const originalTimings = targetCues.map((cue) => ({
      id: cue.id,
      startMs: cue.start.milliseconds,
      endMs: cue.end.milliseconds,
    }));

    // Get indices for the document.shift call
    const indices = targetCues.map((c) => c.index);

    track.document.shift(indices.length > 0 ? indices : null, {
      offset: offsetMs,
    });

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:shift",
        description: `Shift cues by ${offsetMs}ms`,
        undo: () => {
          // Restore original timings
          for (const timing of originalTimings) {
            this.updateCueInternal(trackId, timing.id, {
              startMs: timing.startMs,
              endMs: timing.endMs,
            });
          }
        },
        redo: () => this.shiftCuesInternal(trackId, offsetMs, cueIds),
      });
    }
  }

  /**
   * Internal shift that doesn't record to history.
   */
  private shiftCuesInternal(
    trackId: EntityId,
    offsetMs: number,
    cueIds: string[] | null,
  ): void {
    const track = this.get(trackId);
    if (!track) return;

    // Get indices for the document.shift call
    const indices =
      cueIds !== null
        ? cueIds
            .map((id) => this.getCue(trackId, id)?.index)
            .filter((idx): idx is number => idx !== undefined)
        : null;

    track.document.shift(indices, { offset: offsetMs });
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Scales the timing of all cues by a factor.
   */
  scaleCues(trackId: EntityId, factor: number, anchorMs: number = 0): void {
    const track = this.get(trackId);
    if (!track) return;

    // Capture original timings for history (using IDs for stability)
    const originalTimings = track.document.getCues().map((cue) => ({
      id: cue.id,
      startMs: cue.start.milliseconds,
      endMs: cue.end.milliseconds,
    }));

    track.document.scale(factor, anchorMs);

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:scale",
        description: `Scale cues by ${factor}`,
        undo: () => {
          // Restore original timings
          for (const timing of originalTimings) {
            this.updateCueInternal(trackId, timing.id, {
              startMs: timing.startMs,
              endMs: timing.endMs,
            });
          }
        },
        redo: () => this.scaleCuesInternal(trackId, factor, anchorMs),
      });
    }
  }

  /**
   * Internal scale that doesn't record to history.
   */
  private scaleCuesInternal(
    trackId: EntityId,
    factor: number,
    anchorMs: number,
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    track.document.scale(factor, anchorMs);
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  // ---------------------------------------------------------------------------
  // Document Operations
  // ---------------------------------------------------------------------------

  /**
   * Sorts all cues by their start time.
   */
  sortCuesByTime(trackId: EntityId): void {
    const track = this.get(trackId);
    if (!track) return;

    track.document.sortByTime();

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Note: Auto-recording to history is not implemented for sort
    // as proper undo would require storing the full cue order before sorting
  }

  /**
   * Internal sort that doesn't record to history.
   */
  private sortCuesByTimeInternal(trackId: EntityId): void {
    const track = this.get(trackId);
    if (!track) return;
    track.document.sortByTime();
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Fixes overlapping cues.
   */
  fixOverlaps(trackId: EntityId, mode: "trim" | "remove" = "trim"): void {
    const track = this.get(trackId);
    if (!track) return;

    // Capture original cue data for history (using IDs for stability)
    const originalCues = track.document.getCues().map((cue) => ({
      id: cue.id,
      text: cue.text,
      startMs: cue.start.milliseconds,
      endMs: cue.end.milliseconds,
    }));

    track.document.fixOverlaps(mode);

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:fix-overlaps",
        description: `Fix overlaps (${mode})`,
        undo: () => {
          // Restore all original cue timings
          for (const cueData of originalCues) {
            const currentCue = this.getCue(trackId, cueData.id);
            if (currentCue) {
              this.updateCueInternal(trackId, cueData.id, {
                startMs: cueData.startMs,
                endMs: cueData.endMs,
              });
            }
          }
        },
        redo: () => this.fixOverlapsInternal(trackId, mode),
      });
    }
  }

  /**
   * Internal fix overlaps that doesn't record to history.
   */
  private fixOverlapsInternal(
    trackId: EntityId,
    mode: "trim" | "remove",
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    track.document.fixOverlaps(mode);
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Gets all pairs of overlapping cues.
   */
  getOverlappingCues(trackId: EntityId) {
    const track = this.get(trackId);
    if (!track) return [];
    return track.document.getOverlappingCues();
  }

  /**
   * Exports a track to its original format.
   */
  export(trackId: EntityId): string | null {
    const track = this.get(trackId);
    if (!track) return null;
    return SubtitleParser.stringify(track.document.getFormat(), track.document);
  }

  /**
   * Clears all tracks.
   */
  clear(): void {
    this.store.set({ tracks: [] });
  }

  /**
   * Destroys the module.
   */
  destroy(): void {
    this.clear();
  }
}
