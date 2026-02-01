import { Store } from "@ptl/store";

import { type Sequence, type Source } from "../model";
import { type ClipInstance } from "./clips/ClipInstance";
import { createSourceInstance } from "./sources";
import { type SourceInstance } from "./sources/SourceInstance";
import { TrackInstance } from "./TrackInstance";

/**
 * Class representing a sequence instance.
 */
export class SequenceInstance {
  private readonly store: Store<Sequence>;

  private readonly clipInstances: Map<string, ClipInstance<any>> = new Map();
  private readonly trackInstances: Map<string, TrackInstance> = new Map();
  private readonly sourceInstances: Map<string, SourceInstance<any>> =
    new Map();

  constructor(model: Sequence) {
    this.store = new Store<Sequence>(model);
  }

  /** Get the store for the sequence model. */
  getStore(): Store<Sequence> {
    return this.store;
  }

  // Source

  /**
   * Get a source instance by its ID.
   * @param sourceId - The ID of the source.
   * @returns The source instance, or undefined if not found.
   */
  getSourceInstance<T extends Source = Source>(
    sourceId: string,
  ): SourceInstance<T> | undefined {
    if (!this.sourceInstances.has(sourceId)) {
      const { sources } = this.store.get();

      const sourceModel = sources[sourceId];
      if (!sourceModel) {
        return undefined;
      }

      const instance = createSourceInstance(this, sourceModel);
      this.sourceInstances.set(sourceId, instance);
    }

    return this.sourceInstances.get(sourceId);
  }

  /**
   * Invalidate a source instance by its ID.
   * @param sourceId - The ID of the source.
   */
  invalidateSourceInstance(sourceId: string): void {
    this.sourceInstances.delete(sourceId);
  }

  // Track

  /**
   * Get a track instance by its ID.
   * @param trackId - The ID of the track.
   * @returns The track instance, or undefined if not found.
   */
  getTrackInstance(trackId: string): TrackInstance | undefined {
    if (!this.trackInstances.has(trackId)) {
      const { tracks } = this.store.get();

      const trackModel = tracks[trackId];
      if (!trackModel) {
        return undefined;
      }

      const instance = new TrackInstance(this, trackModel.id);
      this.trackInstances.set(trackId, instance);
    }

    return this.trackInstances.get(trackId);
  }

  /**
   * Invalidate a track instance by its ID.
   * @param trackId - The ID of the track.
   */
  invalidateTrackInstance(trackId: string): void {
    this.trackInstances.delete(trackId);
  }

  // Clip

  /**
   * Get a clip instance by its ID.
   * @param clipId - The ID of the clip.
   * @returns The clip instance, or undefined if not found.
   */
  getClipInstance<T extends ClipInstance<any> = ClipInstance<any>>(
    clipId: string,
  ): T | undefined {
    if (!this.clipInstances.has(clipId)) {
      const { clips } = this.store.get();

      const clipModel = clips[clipId];
      if (!clipModel) {
        return undefined;
      }
    }

    return this.clipInstances.get(clipId) as T;
  }

  /**
   * Invalidate a clip instance by its ID.
   * @param clipId - The ID of the clip.
   */
  invalidateClipInstance(clipId: string): void {
    this.clipInstances.delete(clipId);
  }

  // Serialization

  /** Serialize the sequence instance to its model representation. */
  toJSON(): Sequence {
    return this.store.get();
  }
}
