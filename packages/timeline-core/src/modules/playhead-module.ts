import { type Entity } from "@ptl/ecs";

import { Playable, UnitPosition } from "../components";
import { createPlayhead, type CreatePlayheadOptions } from "../entities";
import { type TimelineApi } from "../timeline";
import { type TimelineModule } from "../timeline-module";

export type PlayheadApi = {
  getEntity(): Entity | null;
  setPosition(position: number): void;
  getPosition(): number;
  moveForward(delta: number): void;
  moveBackward(delta: number): void;
  play(delta: number): void;
  pause(): void;
};

export class PlayheadModule implements TimelineModule<PlayheadApi> {
  static id = "PlayheadModule";

  private playheadEntity: Entity | null = null;
  private rafId: number | null = null;

  private unsubscribers: Array<() => void> = [];
  private timeline?: TimelineApi;

  constructor(private readonly options: CreatePlayheadOptions = {}) {}

  // Lifecycle Methods

  /**
   * Attach the PlayheadModule to a TimelineApi instance.
   * @param timeline - The TimelineApi instance to attach to.
   */
  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
    this.playheadEntity = createPlayhead(timeline, this.options);
  }

  /**
   * Detach the PlayheadModule from the TimelineApi instance.
   */
  detach(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.timeline = undefined;
  }

  // API Methods

  /**
   * Get the playhead entity.
   * @returns The playhead entity or null if not available.
   */
  getEntity(): Entity | null {
    return this.playheadEntity;
  }

  /**
   * Set the playhead position.
   * @param unit - The new position in units.
   */
  setPosition(unit: number): void {
    if (!this.playheadEntity || !this.timeline) return;
    const world = this.timeline.getWorld();
    world.updateComponent(this.playheadEntity, UnitPosition, (value) => ({
      ...value,
      unit: Math.max(0, unit),
    }));
  }

  /**
   * Get the current playhead position.
   * @returns The current position in units.
   */
  getPosition(): number {
    if (!this.playheadEntity || !this.timeline) return 0;
    const world = this.timeline.getWorld();
    const positionComponent = world.getComponent(
      this.playheadEntity,
      UnitPosition,
    );
    return positionComponent?.unit ?? 0;
  }

  /**
   * Move the playhead forward by a specified delta.
   * @param delta - The amount to move forward in units.
   */
  moveForward(delta: number): void {
    if (!this.playheadEntity) return;
    const currentPosition = this.getPosition();
    this.setPosition(currentPosition + delta);
  }

  /**
   * Move the playhead backward by a specified delta.
   * @param delta - The amount to move backward in units.
   */
  moveBackward(delta: number): void {
    if (!this.playheadEntity) return;
    const currentPosition = this.getPosition();
    this.setPosition(currentPosition - delta);
  }

  /**
   * Start playing the playhead, moving it forward continuously.
   * @param delta - The amount to move forward in units per frame.
   */
  play(delta: number): void {
    if (this.rafId !== null || !this.playheadEntity) return; // Already playing

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
    if (!this.playheadEntity) return;
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
    if (!this.playheadEntity || !this.timeline) return;
    const world = this.timeline.getWorld();
    world.updateComponent(this.playheadEntity, Playable, () => ({
      isPlaying,
    }));
  }
}
