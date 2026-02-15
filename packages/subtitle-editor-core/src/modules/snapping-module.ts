import { type CoreApi, Store } from "@ptl/modular-core";

import type { SubtitleEditorApi } from "../editor";
import type { EditorModule } from "../editor-module";
import type { EntityId } from "../types";
import { MarkerModule } from "./marker-module";
import { PlaybackModule } from "./playback-module";
import { TrackModule } from "./track-module";

// ============================================================================
// Snapping Module Options
// ============================================================================

export interface SnappingModuleOptions {
  /** Snap threshold in milliseconds (default: 100) */
  threshold?: number;
  /** Whether snapping is enabled by default (default: true) */
  enabled?: boolean;
  /** Whether to snap to playhead position (default: true) */
  snapToPlayhead?: boolean;
  /** Whether to snap to markers (default: true) */
  snapToMarkers?: boolean;
  /** Whether to snap to other cue edges (default: true) */
  snapToCues?: boolean;
}

// ============================================================================
// Snapping Module State
// ============================================================================

export interface SnappingModuleState {
  /** Whether snapping is enabled */
  enabled: boolean;
  /** Snap threshold in milliseconds */
  threshold: number;
  /** Current snap target for visual feedback (null if not snapping) */
  activeSnapTarget: number | null;
  /** Configuration options */
  snapToPlayhead: boolean;
  snapToMarkers: boolean;
  snapToCues: boolean;
}

const createInitialState = (
  options: SnappingModuleOptions,
): SnappingModuleState => ({
  enabled: options.enabled ?? true,
  threshold: options.threshold ?? 100,
  activeSnapTarget: null,
  snapToPlayhead: options.snapToPlayhead ?? true,
  snapToMarkers: options.snapToMarkers ?? true,
  snapToCues: options.snapToCues ?? true,
});

// ============================================================================
// Snap Result
// ============================================================================

export interface SnapResult {
  /** The snapped value (same as input if no snap occurred) */
  value: number;
  /** Whether a snap occurred */
  snapped: boolean;
  /** The snap target position (null if no snap occurred) */
  target: number | null;
  /** Type of snap target */
  targetType: "playhead" | "marker" | "cue-start" | "cue-end" | null;
}

// ============================================================================
// Snapping Module API
// ============================================================================

export interface SnappingModuleApi {
  getStore(): Store<SnappingModuleState>;
  getState(): SnappingModuleState;

  /** Enable or disable snapping */
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;

  /** Set snap threshold in milliseconds */
  setThreshold(threshold: number): void;
  getThreshold(): number;

  /** Configure what to snap to */
  setSnapToPlayhead(enabled: boolean): void;
  setSnapToMarkers(enabled: boolean): void;
  setSnapToCues(enabled: boolean): void;

  /**
   * Get all snap targets for the current state.
   * @param excludeTrackId - Optional track ID to exclude cues from (to avoid snapping to self)
   * @param excludeCueId - Optional cue id to exclude (to avoid snapping to self)
   */
  getSnapTargets(excludeTrackId?: EntityId, excludeCueId?: string): number[];

  /**
   * Snap a value to the nearest snap target.
   * @param value - The value to potentially snap
   * @param excludeTrackId - Optional track ID to exclude cues from
   * @param excludeCueId - Optional cue id to exclude
   */
  snap(
    value: number,
    excludeTrackId?: EntityId,
    excludeCueId?: string,
  ): SnapResult;

  /**
   * Set the active snap target for visual feedback.
   * Should be called when dragging to show snap indicators.
   */
  setActiveSnapTarget(target: number | null): void;

  /**
   * Clear the active snap target.
   */
  clearActiveSnapTarget(): void;

  destroy(): void;
}

// ============================================================================
// Snapping Module
// ============================================================================

/**
 * Module for handling snapping behavior during drag operations.
 * Provides snap targets based on playhead position, markers, and cue edges.
 */
export class SnappingModule implements EditorModule<SnappingModuleApi> {
  static id = "SnappingModule";

  private readonly store: Store<SnappingModuleState>;
  private editor?: SubtitleEditorApi;

  constructor(options: SnappingModuleOptions = {}) {
    this.store = new Store<SnappingModuleState>(createInitialState(options));
  }

  // Static Methods

  static for<A>(editor: CoreApi<A>): SnappingModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(editor: SubtitleEditorApi): void {
    this.editor = editor;
  }

  detach(): void {
    this.editor = undefined;
  }

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<SnappingModuleState> {
    return this.store;
  }

  getState(): SnappingModuleState {
    return this.store.get();
  }

  // ---------------------------------------------------------------------------
  // Enable/Disable
  // ---------------------------------------------------------------------------

  setEnabled(enabled: boolean): void {
    this.store.update((state) => {
      state.enabled = enabled;
    });
  }

  isEnabled(): boolean {
    return this.getState().enabled;
  }

  // ---------------------------------------------------------------------------
  // Threshold
  // ---------------------------------------------------------------------------

  setThreshold(threshold: number): void {
    this.store.update((state) => {
      state.threshold = Math.max(0, threshold);
    });
  }

  getThreshold(): number {
    return this.getState().threshold;
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setSnapToPlayhead(enabled: boolean): void {
    this.store.update((state) => {
      state.snapToPlayhead = enabled;
    });
  }

  setSnapToMarkers(enabled: boolean): void {
    this.store.update((state) => {
      state.snapToMarkers = enabled;
    });
  }

  setSnapToCues(enabled: boolean): void {
    this.store.update((state) => {
      state.snapToCues = enabled;
    });
  }

  // ---------------------------------------------------------------------------
  // Snap Targets
  // ---------------------------------------------------------------------------

  getSnapTargets(excludeTrackId?: EntityId, excludeCueId?: string): number[] {
    if (!this.editor) return [];

    const state = this.getState();
    const targets: number[] = [];

    // Add playhead position
    if (state.snapToPlayhead) {
      const playbackModule = PlaybackModule.for(this.editor);
      const playheadPosition = playbackModule.getCurrentTime();
      if (playheadPosition >= 0) {
        targets.push(playheadPosition);
      }
    }

    // Add marker positions
    if (state.snapToMarkers) {
      const markerModule = MarkerModule.for(this.editor);
      const markers = markerModule.getMarkers();
      for (const marker of markers) {
        targets.push(marker.time);
      }
    }

    // Add cue edges
    if (state.snapToCues) {
      const trackModule = TrackModule.for(this.editor);
      const tracks = trackModule.getTracks();

      for (const track of tracks) {
        const cues = track.document.getCues();
        for (const cue of cues) {
          // Skip excluded cue
          if (track.id === excludeTrackId && cue.id === excludeCueId) {
            continue;
          }

          targets.push(cue.start.milliseconds);
          targets.push(cue.end.milliseconds);
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(targets)].sort((a, b) => a - b);
  }

  // ---------------------------------------------------------------------------
  // Snapping
  // ---------------------------------------------------------------------------

  snap(
    value: number,
    excludeTrackId?: EntityId,
    excludeCueId?: string,
  ): SnapResult {
    const state = this.getState();

    if (!state.enabled) {
      return {
        value,
        snapped: false,
        target: null,
        targetType: null,
      };
    }

    const threshold = state.threshold;
    const targets = this.getSnapTargets(excludeTrackId, excludeCueId);

    let closestTarget: number | null = null;
    let closestDistance = Infinity;
    let targetType: SnapResult["targetType"] = null;

    for (const target of targets) {
      const distance = Math.abs(value - target);
      if (distance <= threshold && distance < closestDistance) {
        closestTarget = target;
        closestDistance = distance;

        // Determine target type
        targetType = this.getTargetType(target, excludeTrackId, excludeCueId);
      }
    }

    if (closestTarget !== null) {
      return {
        value: closestTarget,
        snapped: true,
        target: closestTarget,
        targetType,
      };
    }

    return {
      value,
      snapped: false,
      target: null,
      targetType: null,
    };
  }

  private getTargetType(
    target: number,
    excludeTrackId?: EntityId,
    excludeCueId?: string,
  ): SnapResult["targetType"] {
    if (!this.editor) return null;

    const state = this.getState();

    // Check playhead
    if (state.snapToPlayhead) {
      const playbackModule = PlaybackModule.for(this.editor);
      if (playbackModule.getCurrentTime() === target) {
        return "playhead";
      }
    }

    // Check markers
    if (state.snapToMarkers) {
      const markerModule = MarkerModule.for(this.editor);
      const markers = markerModule.getMarkers();
      if (markers.some((m) => m.time === target)) {
        return "marker";
      }
    }

    // Check cues
    if (state.snapToCues) {
      const trackModule = TrackModule.for(this.editor);
      const tracks = trackModule.getTracks();

      for (const track of tracks) {
        const cues = track.document.getCues();
        for (const cue of cues) {
          if (track.id === excludeTrackId && cue.id === excludeCueId) {
            continue;
          }

          if (cue.start.milliseconds === target) {
            return "cue-start";
          }
          if (cue.end.milliseconds === target) {
            return "cue-end";
          }
        }
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Active Snap Target (for visual feedback)
  // ---------------------------------------------------------------------------

  setActiveSnapTarget(target: number | null): void {
    this.store.update((state) => {
      state.activeSnapTarget = target;
    });
  }

  clearActiveSnapTarget(): void {
    this.setActiveSnapTarget(null);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    this.editor = undefined;
  }
}
