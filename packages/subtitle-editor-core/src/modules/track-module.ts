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
  getStore(): Store<TrackModuleState>;
  getState(): TrackModuleState;
  getTracks(): SubtitleTrack[];
  loadFile(file: File): Promise<SubtitleTrack>;
  parseAndAdd(filename: string, content: string): SubtitleTrack;
  add(track: SubtitleTrack): void;
  remove(trackId: EntityId): SubtitleTrack | null;
  get(trackId: EntityId): SubtitleTrack | undefined;
  update(trackId: EntityId, updates: Partial<Omit<SubtitleTrack, "id">>): void;
  getCue(
    trackId: EntityId,
    cueIndex: number,
  ): ReturnType<SubtitleTrack["document"]["getCues"]>[number] | undefined;
  updateCue(
    trackId: EntityId,
    cueIndex: number,
    updates: { text?: string; startMs?: number; endMs?: number },
  ): void;
  deleteCue(trackId: EntityId, cueIndex: number): void;
  insertCue(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    text: string,
    atIndex?: number,
  ): void;
  export(trackId: EntityId): string | null;
  clear(): void;
  destroy(): void;
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
   * Gets a cue by index from a track.
   */
  getCue(trackId: EntityId, cueIndex: number) {
    const track = this.get(trackId);
    if (!track) return undefined;
    return track.document.getCues().find((c) => c.index === cueIndex);
  }

  /**
   * Updates a cue in a track.
   */
  updateCue(
    trackId: EntityId,
    cueIndex: number,
    updates: {
      text?: string;
      startMs?: number;
      endMs?: number;
    },
  ): void {
    const track = this.get(trackId);
    if (!track) return;

    // Capture old values for history
    const cue = this.getCue(trackId, cueIndex);
    const oldValues: { text?: string; startMs?: number; endMs?: number } = {};
    if (cue) {
      if (updates.text !== undefined) oldValues.text = cue.text;
      if (updates.startMs !== undefined)
        oldValues.startMs = cue.start.milliseconds;
      if (updates.endMs !== undefined) oldValues.endMs = cue.end.milliseconds;
    }

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

    track.document.update(cueIndex, cueUpdates);

    // Trigger store update to notify subscribers
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:update",
        description: `Update cue ${cueIndex}`,
        undo: () => this.updateCueInternal(trackId, cueIndex, oldValues),
        redo: () => this.updateCueInternal(trackId, cueIndex, updates),
      });
    }
  }

  /**
   * Internal cue update that doesn't record to history.
   */
  private updateCueInternal(
    trackId: EntityId,
    cueIndex: number,
    updates: { text?: string; startMs?: number; endMs?: number },
  ): void {
    const track = this.get(trackId);
    if (!track) return;

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

    track.document.update(cueIndex, cueUpdates);
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
  deleteCue(trackId: EntityId, cueIndex: number): void {
    const track = this.get(trackId);
    if (!track) return;

    // Capture cue data for history
    const cue = this.getCue(trackId, cueIndex);
    const deletedCueData = cue
      ? {
          text: cue.text,
          startMs: cue.start.milliseconds,
          endMs: cue.end.milliseconds,
        }
      : null;

    track.document.remove(cueIndex);

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing() && deletedCueData) {
      this.history.record({
        type: "cue:delete",
        description: `Delete cue ${cueIndex}`,
        undo: () =>
          this.insertCueInternal(
            trackId,
            deletedCueData.startMs,
            deletedCueData.endMs,
            deletedCueData.text,
            cueIndex,
          ),
        redo: () => this.deleteCueInternal(trackId, cueIndex),
      });
    }
  }

  /**
   * Internal delete that doesn't record to history.
   */
  private deleteCueInternal(trackId: EntityId, cueIndex: number): void {
    const track = this.get(trackId);
    if (!track) return;
    track.document.remove(cueIndex);
    this.store.set({ tracks: [...this.getState().tracks] });
  }

  /**
   * Inserts a new cue into a track.
   */
  insertCue(
    trackId: EntityId,
    startMs: number,
    endMs: number,
    text: string,
    atIndex?: number,
  ): void {
    const track = this.get(trackId);
    if (!track) return;

    // Determine the actual index where cue will be inserted
    const insertIndex = atIndex ?? track.document.getCues().length;

    track.document.insert({
      start: { raw: this.formatTimestamp(startMs), milliseconds: startMs },
      end: { raw: this.formatTimestamp(endMs), milliseconds: endMs },
      text,
      index: atIndex,
    });

    // Trigger store update
    this.store.set({ tracks: [...this.getState().tracks] });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "cue:insert",
        description: `Insert cue at ${insertIndex}`,
        undo: () => this.deleteCueInternal(trackId, insertIndex),
        redo: () =>
          this.insertCueInternal(trackId, startMs, endMs, text, insertIndex),
      });
    }
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
  ): void {
    const track = this.get(trackId);
    if (!track) return;
    track.document.insert({
      start: { raw: this.formatTimestamp(startMs), milliseconds: startMs },
      end: { raw: this.formatTimestamp(endMs), milliseconds: endMs },
      text,
      index: atIndex,
    });
    this.store.set({ tracks: [...this.getState().tracks] });
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
