import { Core, type CoreApi } from "@ptl/modular-core";
import { type SubtitleCue } from "@ptl/subtitle-kit";

import type { EditorModule } from "./editor-module";
import {
  DragModule,
  HistoryModule,
  MarkerModule,
  type PlaybackController,
  PlaybackModule,
  SelectionModule,
  SnappingModule,
  TrackModule,
} from "./modules";
import type {
  EntityId,
  LoadedMedia,
  MarkerType,
  SubtitleTrack,
  VideoMetadata,
} from "./types"; // Re-export PlaybackController for convenience

// Re-export PlaybackController for convenience
export type { PlaybackController };

// ============================================================================
// Editor State (minimal root state)
// ============================================================================

export interface EditorState {
  /** Loaded media information */
  media: LoadedMedia | null;
}

const createInitialState = (): EditorState => ({
  media: null,
});

// ============================================================================
// Editor Options
// ============================================================================

export interface EditorOptions {
  /** Whether to auto-select newly loaded tracks */
  autoSelectNewTracks?: boolean;
  /** Whether to enable history/undo-redo (default: true) */
  enableHistory?: boolean;
  /** Maximum history stack size (default: 100) */
  maxHistorySize?: number;
  /** Additional modules to register */
  modules?: EditorModule[];
}

const defaultOptions: Required<Omit<EditorOptions, "modules">> = {
  autoSelectNewTracks: true,
  enableHistory: true,
  maxHistorySize: 100,
};

// ============================================================================
// Subtitle Editor API
// ============================================================================

export interface SubtitleEditorApi extends CoreApi<EditorState> {
  // Options
  getOptions(): EditorOptions;

  // Media
  loadMedia(file: File): Promise<LoadedMedia>;
  getMedia(): LoadedMedia | null;
  unloadMedia(): void;

  // Playback Controller
  connectPlaybackController(controller: PlaybackController): void;
  disconnectPlaybackController(): void;

  // Track Convenience Methods
  loadSubtitleFile(file: File): Promise<EntityId>;
  removeTrack(trackId: EntityId): void;
  getActiveTrack(): SubtitleTrack | undefined;

  // Marker Convenience Methods
  addMarkerAtCurrentTime(
    type?: MarkerType,
    label?: string,
  ): ReturnType<MarkerModule["add"]>;
  addMarkerAtTime(
    time: number,
    type?: MarkerType,
    label?: string,
  ): ReturnType<MarkerModule["add"]>;
  goToNextMarker(): void;
  goToPreviousMarker(): void;

  // Cue Navigation
  goToCue(trackId: EntityId, cueId: string): void;
  goToNextCue(): void;
  goToPreviousCue(): void;
  getCurrentCue(trackId?: EntityId): SubtitleCue<any> | null;

  // History/Undo-Redo
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;

  // Lifecycle
  reset(): void;
}

// ============================================================================
// Subtitle Editor
// ============================================================================

/**
 * The main subtitle editor class.
 * Extends Core to provide module management and state.
 * Composes modules for tracks, markers, selection, and playback.
 * This class is UI-framework agnostic.
 */
export class SubtitleEditor
  extends Core<EditorState>
  implements SubtitleEditorApi
{
  private readonly options: Required<Omit<EditorOptions, "modules">>;

  private readonly _tracks: TrackModule;
  private readonly _markers: MarkerModule;
  private readonly _selection: SelectionModule;
  private readonly _playback: PlaybackModule;
  private readonly _history: HistoryModule | null;

  constructor(options: EditorOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };

    const history = mergedOptions.enableHistory
      ? new HistoryModule({ maxHistorySize: mergedOptions.maxHistorySize })
      : null;

    const tracks = new TrackModule({ history });
    const markers = new MarkerModule({ history });
    const selection = new SelectionModule();
    const playback = new PlaybackModule();
    const snapping = new SnappingModule();
    const drag = new DragModule();

    const builtInModules: EditorModule[] = [
      tracks,
      markers,
      selection,
      playback,
      snapping,
      drag,
    ];

    if (history) {
      builtInModules.push(history);
    }

    super({
      initialState: createInitialState(),
      modules: [...builtInModules, ...(options.modules ?? [])],
    });

    this._tracks = tracks;
    this._markers = markers;
    this._selection = selection;
    this._playback = playback;
    this._history = history;

    this.options = mergedOptions;
    super.setup();
  }

  // ---------------------------------------------------------------------------
  // Options
  // ---------------------------------------------------------------------------

  getOptions(): EditorOptions {
    return this.options;
  }

  // ---------------------------------------------------------------------------
  // Media
  // ---------------------------------------------------------------------------

  /**
   * Loads video metadata from a file.
   */
  loadMedia(file: File): Promise<LoadedMedia> {
    return new Promise((resolve, reject) => {
      // Cleanup previous media
      this.unloadMedia();

      const video = document.createElement("video");
      video.preload = "metadata";

      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          aspectRatio: video.videoWidth / video.videoHeight,
          width: video.videoWidth,
          height: video.videoHeight,
        };

        const media: LoadedMedia = {
          url,
          filename: file.name,
          metadata,
        };

        this.store.set({ media });
        this._playback.setDuration(video.duration * 1000);
        resolve(media);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video metadata"));
      };

      video.src = url;
    });
  }

  /**
   * Gets the loaded media.
   */
  getMedia(): LoadedMedia | null {
    return this.getState().media;
  }

  /**
   * Unloads the current media.
   */
  unloadMedia(): void {
    const { media } = this.getState();
    if (media?.url) {
      URL.revokeObjectURL(media.url);
    }
    this.store.set({ media: null });
    this._playback.reset();
  }

  // ---------------------------------------------------------------------------
  // Playback Controller Connection
  // ---------------------------------------------------------------------------

  /**
   * Connects a playback controller (typically a video element wrapper).
   */
  connectPlaybackController(controller: PlaybackController): void {
    this._playback.connect(controller);
  }

  /**
   * Disconnects the playback controller.
   */
  disconnectPlaybackController(): void {
    this._playback.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Track Convenience Methods
  // ---------------------------------------------------------------------------

  /**
   * Loads a subtitle file.
   */
  async loadSubtitleFile(file: File): Promise<EntityId> {
    const track = await this._tracks.loadFile(file);

    if (this.options.autoSelectNewTracks) {
      this._selection.setActiveTrack(track.id);
    }

    return track.id;
  }

  /**
   * Removes a track.
   */
  removeTrack(trackId: EntityId): void {
    this._tracks.remove(trackId);
  }

  /**
   * Gets the currently active track.
   */
  getActiveTrack(): SubtitleTrack | undefined {
    const activeId = this._selection.getActiveTrackId();
    return activeId ? this._tracks.get(activeId) : undefined;
  }

  // ---------------------------------------------------------------------------
  // Marker Convenience Methods
  // ---------------------------------------------------------------------------

  /**
   * Adds a marker at the current playback time.
   */
  addMarkerAtCurrentTime(type: MarkerType = "bookmark", label?: string) {
    const time = this._playback.getCurrentTime();
    return this._markers.add(time, type, label);
  }

  /**
   * Adds a marker at a specific time.
   */
  addMarkerAtTime(time: number, type: MarkerType = "bookmark", label?: string) {
    return this._markers.add(time, type, label);
  }

  /**
   * Navigates to the next marker.
   */
  goToNextMarker(): void {
    const currentTime = this._playback.getCurrentTime();
    const next = this._markers.getNearest(currentTime, "after");
    if (next) {
      this._playback.seek(next.time);
    }
  }

  /**
   * Navigates to the previous marker.
   */
  goToPreviousMarker(): void {
    const currentTime = this._playback.getCurrentTime();
    const prev = this._markers.getNearest(currentTime, "before");
    if (prev) {
      this._playback.seek(prev.time);
    }
  }

  // ---------------------------------------------------------------------------
  // Cue Navigation
  // ---------------------------------------------------------------------------

  /**
   * Selects and navigates to a cue.
   */
  goToCue(trackId: EntityId, cueId: string): void {
    const track = this._tracks.get(trackId);
    if (!track) return;

    const cue = track.document.getCueById(cueId);
    if (!cue) return;

    this._selection.selectCue(trackId, cueId);
    this._playback.seek(cue.start.milliseconds);
  }

  /**
   * Navigates to the next cue in the active track.
   */
  goToNextCue(): void {
    const track = this.getActiveTrack();
    if (!track) return;

    const currentTime = this._playback.getCurrentTime();
    const cues = track.document.getCues();
    const nextCue = cues.find((c) => c.start.milliseconds > currentTime);

    if (nextCue) {
      this.goToCue(track.id, nextCue.id);
    }
  }

  /**
   * Navigates to the previous cue in the active track.
   */
  goToPreviousCue(): void {
    const track = this.getActiveTrack();
    if (!track) return;

    const currentTime = this._playback.getCurrentTime();
    const cues = track.document.getCues();
    const prevCue = cues.findLast((c) => c.start.milliseconds < currentTime);

    if (prevCue) {
      this.goToCue(track.id, prevCue.id);
    }
  }

  /**
   * Gets the current cue at playhead position.
   */
  getCurrentCue(trackId?: EntityId) {
    const id = trackId ?? this._selection.getActiveTrackId();
    if (!id) return null;

    const track = this._tracks.get(id);
    if (!track) return null;

    const currentTime = this._playback.getCurrentTime();
    return track.document.getFirstAt(currentTime);
  }

  // ---------------------------------------------------------------------------
  // History / Undo-Redo
  // ---------------------------------------------------------------------------

  /**
   * Undo the last action.
   * @returns true if an action was undone, false if nothing to undo
   */
  undo(): boolean {
    return this._history?.undo() ?? false;
  }

  /**
   * Redo the last undone action.
   * @returns true if an action was redone, false if nothing to redo
   */
  redo(): boolean {
    return this._history?.redo() ?? false;
  }

  /**
   * Check if there are actions to undo.
   */
  canUndo(): boolean {
    return this._history?.canUndo() ?? false;
  }

  /**
   * Check if there are actions to redo.
   */
  canRedo(): boolean {
    return this._history?.canRedo() ?? false;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Resets the editor to initial state.
   */
  reset(): void {
    this.unloadMedia();
    this._tracks.clear();
    this._markers.clear();
    this._selection.clearAll();
    this._playback.reset();
    this._history?.clear();
  }
}
