import { Store } from "@ptl/store";

import { type TimelineApi } from "../timeline";
import { type TimelineModule } from "../timeline-module";

export type CreatePlayheadOptions = {
  initialPosition?: number;
};

export type PlayheadState = {
  position: number;
  isPlaying: boolean;
};

export type PlayheadApi = {
  getStore(): Store<PlayheadState>;
  setPosition(position: number): void;
  getPosition(): number;
  moveForward(delta: number): void;
  moveBackward(delta: number): void;
  play(delta: number): void;
  pause(): void;
};

export class PlayheadModule implements TimelineModule<PlayheadApi> {
  static id = "PlayheadModule";

  private store: Store<PlayheadState>;
  private rafId: number | null = null;

  private unsubscribers: Array<() => void> = [];
  private timeline?: TimelineApi;

  constructor(options: CreatePlayheadOptions = {}) {
    this.store = new Store<PlayheadState>({
      position: options.initialPosition ?? 0,
      isPlaying: false,
    });
  }

  // Lifecycle Methods

  /**
   * Attach the PlayheadModule to a TimelineApi instance.
   * @param timeline - The TimelineApi instance to attach to.
   */
  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
  }

  /**
   * Detach the PlayheadModule from the TimelineApi instance.
   */
  detach(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.timeline = undefined;
  }

  /**
   * Get the PlayheadModule's store.
   * @returns The Store containing the PlayheadState.
   */
  getStore(): Store<PlayheadState> {
    return this.store;
  }

  // API Methods

  /**
   * Set the playhead position.
   * @param unit - The new position in units.
   */
  setPosition(unit: number): void {
    if (!this.timeline) return;
    this.store.update((prev) => ({
      ...prev,
      position: Math.max(0, unit),
    }));
  }

  /**
   * Get the current playhead position.
   * @returns The current position in units.
   */
  getPosition(): number {
    if (!this.timeline) return 0;
    return this.store.select((state) => state.position);
  }

  /**
   * Move the playhead forward by a specified delta.
   * @param delta - The amount to move forward in units.
   */
  moveForward(delta: number): void {
    const currentPosition = this.getPosition();
    this.setPosition(currentPosition + delta);
  }

  /**
   * Move the playhead backward by a specified delta.
   * @param delta - The amount to move backward in units.
   */
  moveBackward(delta: number): void {
    const currentPosition = this.getPosition();
    this.setPosition(currentPosition - delta);
  }

  /**
   * Start playing the playhead, moving it forward continuously.
   * @param delta - The amount to move forward in units per frame.
   */
  play(delta: number): void {
    if (this.rafId !== null) return; // Already playing

    const step = () => {
      this.moveForward(delta);
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
    this.setPlaying(true);
  }

  /**
   * Pause the playhead, stopping its continuous movement.
   */
  pause(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.setPlaying(false);
  }

  /**
   * Set the playing state of the playhead.
   * @param isPlaying - Whether the playhead is playing.
   * @private
   */
  private setPlaying(isPlaying: boolean): void {
    if (!this.timeline) return;
    this.store.update((prev) => ({
      ...prev,
      isPlaying,
    }));
  }
}
