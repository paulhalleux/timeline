import { Store } from "@ptl/store";

import { MarkerModule } from "./marker-module";
import { type PlaybackController, PlaybackModule } from "./playback-module";
import { SelectionModule } from "./selection-module";
import { TrackModule } from "./track-module";
import type {
  EditorEvent,
  EditorEventHandler,
  EditorEventType,
  EntityId,
  LoadedMedia,
  MarkerType,
  VideoMetadata,
} from "./types";

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
}

const defaultOptions: Required<EditorOptions> = {
  autoSelectNewTracks: true,
};

// ============================================================================
// Subtitle Editor
// ============================================================================

/**
 * The main subtitle editor class.
 * Composes modules for tracks, markers, selection, and playback.
 * This class is UI-framework agnostic.
 */
export class SubtitleEditor {
  private store: Store<EditorState>;
  private options: Required<EditorOptions>;

  // Modules
  readonly tracks: TrackModule;
  readonly markers: MarkerModule;
  readonly selection: SelectionModule;
  readonly playback: PlaybackModule;

  // Event handlers
  private eventHandlers: Map<EditorEventType, Set<EditorEventHandler>>;

  constructor(options: EditorOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.store = new Store<EditorState>(createInitialState());
    this.eventHandlers = new Map();

    // Initialize modules
    this.tracks = new TrackModule();
    this.markers = new MarkerModule();
    this.selection = new SelectionModule();
    this.playback = new PlaybackModule();

    // Setup internal subscriptions
    this.setupSubscriptions();
  }

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<EditorState> {
    return this.store;
  }

  getState(): EditorState {
    return this.store.get();
  }

  // ---------------------------------------------------------------------------
  // Internal Subscriptions
  // ---------------------------------------------------------------------------

  private setupSubscriptions(): void {
    // When a track is removed, update selection
    this.tracks.getStore().subscribe(({ tracks }) => {
      const activeTrackId = this.selection.getActiveTrackId();
      if (activeTrackId && !tracks.find((t) => t.id === activeTrackId)) {
        // Active track was removed, select another
        const newActiveId = tracks.length > 0 ? tracks[0].id : null;
        this.selection.setActiveTrack(newActiveId);
        this.selection.onTrackRemoved(activeTrackId);
      }
    });
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
        this.playback.setDuration(video.duration * 1000);
        this.emit("media:loaded", media);
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
    this.playback.reset();
    this.emit("media:unloaded", null);
  }

  // ---------------------------------------------------------------------------
  // Playback Controller Connection
  // ---------------------------------------------------------------------------

  /**
   * Connects a playback controller (typically a video element wrapper).
   */
  connectPlaybackController(controller: PlaybackController): void {
    this.playback.connect(controller);
  }

  /**
   * Disconnects the playback controller.
   */
  disconnectPlaybackController(): void {
    this.playback.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Track Convenience Methods
  // ---------------------------------------------------------------------------

  /**
   * Loads a subtitle file.
   */
  async loadSubtitleFile(file: File): Promise<EntityId> {
    const track = await this.tracks.loadFile(file);

    if (this.options.autoSelectNewTracks) {
      this.selection.setActiveTrack(track.id);
    }

    this.emit("track:added", track);
    return track.id;
  }

  /**
   * Removes a track.
   */
  removeTrack(trackId: EntityId): void {
    const track = this.tracks.remove(trackId);
    if (track) {
      this.emit("track:removed", track);
    }
  }

  /**
   * Gets the currently active track.
   */
  getActiveTrack() {
    const activeId = this.selection.getActiveTrackId();
    return activeId ? this.tracks.get(activeId) : undefined;
  }

  // ---------------------------------------------------------------------------
  // Marker Convenience Methods
  // ---------------------------------------------------------------------------

  /**
   * Adds a marker at the current playback time.
   */
  addMarkerAtCurrentTime(type: MarkerType = "bookmark", label?: string) {
    const time = this.playback.getCurrentTime();
    const marker = this.markers.add(time, type, label);
    this.emit("marker:added", marker);
    return marker;
  }

  /**
   * Adds a marker at a specific time.
   */
  addMarkerAtTime(time: number, type: MarkerType = "bookmark", label?: string) {
    const marker = this.markers.add(time, type, label);
    this.emit("marker:added", marker);
    return marker;
  }

  /**
   * Navigates to the next marker.
   */
  goToNextMarker(): void {
    const currentTime = this.playback.getCurrentTime();
    const next = this.markers.getNearest(currentTime, "after");
    if (next) {
      this.playback.seek(next.time);
    }
  }

  /**
   * Navigates to the previous marker.
   */
  goToPreviousMarker(): void {
    const currentTime = this.playback.getCurrentTime();
    const prev = this.markers.getNearest(currentTime, "before");
    if (prev) {
      this.playback.seek(prev.time);
    }
  }

  // ---------------------------------------------------------------------------
  // Cue Navigation
  // ---------------------------------------------------------------------------

  /**
   * Selects and navigates to a cue.
   */
  goToCue(trackId: EntityId, cueIndex: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    const cue = track.document.getCues()[cueIndex];
    if (!cue) return;

    this.selection.selectCue(trackId, cueIndex);
    this.playback.seek(cue.start.milliseconds);
  }

  /**
   * Navigates to the next cue in the active track.
   */
  goToNextCue(): void {
    const track = this.getActiveTrack();
    if (!track) return;

    const currentTime = this.playback.getCurrentTime();
    const cues = track.document.getCues();
    const nextCue = cues.find((c) => c.start.milliseconds > currentTime);

    if (nextCue) {
      this.goToCue(track.id, nextCue.index);
    }
  }

  /**
   * Navigates to the previous cue in the active track.
   */
  goToPreviousCue(): void {
    const track = this.getActiveTrack();
    if (!track) return;

    const currentTime = this.playback.getCurrentTime();
    const cues = track.document.getCues();
    const prevCues = cues.filter((c) => c.start.milliseconds < currentTime);

    if (prevCues.length > 0) {
      const prevCue = prevCues[prevCues.length - 1];
      this.goToCue(track.id, prevCue.index);
    }
  }

  /**
   * Gets the current cue at playhead position.
   */
  getCurrentCue(trackId?: EntityId) {
    const id = trackId ?? this.selection.getActiveTrackId();
    if (!id) return null;

    const track = this.tracks.get(id);
    if (!track) return null;

    const currentTime = this.playback.getCurrentTime();
    return track.document.getFirstAt(currentTime);
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to editor events.
   */
  on<T = unknown>(
    eventType: EditorEventType,
    handler: EditorEventHandler<T>,
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as EditorEventHandler);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler as EditorEventHandler);
    };
  }

  /**
   * Emits an event.
   */
  private emit<T = unknown>(eventType: EditorEventType, data: T): void {
    const event: EditorEvent<T> = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    this.eventHandlers.get(eventType)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Resets the editor to initial state.
   */
  reset(): void {
    this.unloadMedia();
    this.tracks.clear();
    this.markers.clear();
    this.selection.clearAll();
    this.playback.reset();
  }

  /**
   * Destroys the editor and cleans up resources.
   */
  destroy(): void {
    this.reset();
    this.tracks.destroy();
    this.markers.destroy();
    this.selection.destroy();
    this.playback.destroy();
    this.eventHandlers.clear();
  }
}
