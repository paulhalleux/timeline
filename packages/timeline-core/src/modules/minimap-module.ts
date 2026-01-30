import { Store } from "@ptl/store";

import { type TimelineApi } from "../timeline";
import { type TimelineModule } from "../timeline-module";

export type MinimapState = {
  /** total duration represented by the minimap */
  totalRange: number;

  /** visible window start (0–1 ratio) */
  visibleStartRatio: number;

  /** visible window size (0–1 ratio) */
  visibleSizeRatio: number;

  /** whether the visible size ratio is overflowing the allowed range */
  overflowAmount?: number;
};

export type MinimapOptions = {
  initialTotalRange?: number;

  /**
   * Function to compute the total range represented by the minimap.
   * @param timeline - The TimelineApi instance.
   * @returns The total range value or an object containing range and overflow.
   */
  computeTotalRange?: (
    timeline: TimelineApi,
  ) => number | { range: number; overflow: number };
};

export type MinimapApi = {
  setTotalRange(totalRange: number): void;
  setVisibleStartRatio(visibleStartRatio: number): void;
  setVisibleSizeRatio(visibleSizeRatio: number): void;
  moveCenterTo(leftDelta: number): void;
  extendVisibleRange(delta: number, side: "left" | "right"): void;
  getMinSizeRatio(): number;
  getMaxSizeRatio(): number;
  isOverflowing(): boolean;
  getOverflowAmount(): number;
  getStore(): Store<MinimapState>;
};

export class MinimapModule implements TimelineModule<MinimapApi> {
  static id = "MinimapModule";

  private readonly store: Store<MinimapState>;
  private unsubscribe?: () => void;
  private timeline?: TimelineApi;

  constructor(private readonly options: MinimapOptions = {}) {
    this.store = new Store({
      totalRange: options.initialTotalRange ?? 10000,
      visibleStartRatio: 0,
      visibleSizeRatio: 0,
    });
  }

  // Lifecycle Methods

  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
    this.unsubscribe = timeline.subscribe(() => {
      this.recompute();
      this.recomputeTotalRange();
    });
  }

  detach(): void {
    this.timeline = undefined;
    this.unsubscribe?.();
  }

  // API Methods

  /**
   * Get the store containing the minimap state.
   * @returns The Store instance with MinimapState.
   */
  getStore(): Store<MinimapState> {
    return this.store;
  }

  /**
   * Set the total range represented by the minimap.
   * @param totalRange - The total range value to set.
   */
  setTotalRange(totalRange: number): void {
    this.store.update((prev) => ({
      ...prev,
      totalRange,
    }));
    this.recompute();
  }

  /**
   * Set the overflow amount of the minimap.
   * @param overflowAmount - The overflow amount to set.
   */
  setOverflowAmount(overflowAmount: number | undefined): void {
    this.store.update((prev) => ({
      ...prev,
      overflowAmount,
    }));
  }

  /**
   * Set the visible start ratio of the minimap.
   * @param visibleStartRatio - The visible start ratio (0–1) to set.
   */
  setVisibleStartRatio(visibleStartRatio: number): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const { visibleSizeRatio, totalRange } = this.getStore().get();
    const normalizedVisibleStartRatio = Math.max(
      0,
      Math.min(1 - visibleSizeRatio, visibleStartRatio),
    );

    timeline.setCurrentPosition(totalRange * normalizedVisibleStartRatio);
  }

  /**
   * Set the visible size ratio of the minimap.
   * @param visibleSizeRatio - The visible size ratio (0–1) to set.
   */
  setVisibleSizeRatio(visibleSizeRatio: number): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const { totalRange } = this.getStore().get();
    const clampedVisibleSizeRatio = Math.max(0, Math.min(1, visibleSizeRatio));
    timeline.setVisibleRange(totalRange * clampedVisibleSizeRatio);
  }

  /**
   * Move the center of the visible window to a new position based on the left delta ratio.
   * @param leftDelta - The left delta ratio (0–1) to move the center to.
   */
  moveCenterTo(leftDelta: number): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const {
      visibleSizeRatio,
      totalRange,
      overflowAmount = 0,
    } = this.getStore().get();
    const normalizedLeftDelta = Math.max(
      visibleSizeRatio / 2,
      Math.min(1 - visibleSizeRatio / 2, leftDelta),
    );

    const visibleRange = timeline.getVisibleRange();
    timeline.setCurrentPosition(
      (totalRange - overflowAmount) * normalizedLeftDelta - visibleRange / 2,
    );
  }

  /**
   * Extend the visible range of the minimap on the specified side by a given delta.
   * @param delta - The amount to extend the visible range.
   * @param side - The side ("left" or "right") to extend.
   */
  extendVisibleRange(delta: number, side: "left" | "right"): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const { visibleSizeRatio, visibleStartRatio, totalRange } =
      this.getStore().get();
    const { maxVisibleRange, minVisibleRange } = timeline.getOptions();

    const maxSizeRatio = (1 / totalRange) * maxVisibleRange;
    const minSizeRatio = (1 / totalRange) * minVisibleRange;

    if (side === "right") {
      this.setVisibleSizeRatio(
        Math.min(visibleSizeRatio + delta, 1 - visibleStartRatio),
      );
    } else {
      const newSizeRatio = Math.max(
        Math.min(visibleSizeRatio + delta, maxSizeRatio),
        minSizeRatio,
      );
      const newStartRatio = Math.max(0, visibleStartRatio - delta);
      const clampedStartRatio = Math.max(
        0,
        Math.min(1 - newSizeRatio, newStartRatio),
      );
      timeline.setCurrentPosition(totalRange * clampedStartRatio);
      timeline.setVisibleRange(totalRange * newSizeRatio);
    }
  }

  /**
   * Check if the visible size ratio is overflowing the allowed range.
   * @returns True if overflowing, false otherwise.
   */
  isOverflowing(): boolean {
    if (!this.timeline) {
      return false;
    }

    const { totalRange, overflowAmount } = this.getStore().get();
    if (overflowAmount !== undefined) {
      return overflowAmount > 0;
    }

    return this.timeline.getBounds().end > totalRange;
  }

  /**
   * Get the amount by which the visible size ratio overflows the allowed range.
   * @returns The overflow amount (0 if not overflowing).
   */
  getOverflowAmount(): number {
    if (!this.timeline) {
      return 0;
    }

    const { totalRange, overflowAmount } = this.getStore().get();
    if (overflowAmount !== undefined) {
      return overflowAmount;
    }

    return Math.max(0, this.timeline.getBounds().end - totalRange);
  }

  /**
   * Get the minimum size ratio allowed for the visible window.
   * @returns The minimum size ratio (0–1).
   */
  getMinSizeRatio(): number {
    if (!this.timeline) {
      return 0;
    }
    const { minVisibleRange } = this.timeline.getOptions();
    const { totalRange } = this.getStore().get();
    return (1 / totalRange) * minVisibleRange;
  }

  /**
   * Get the maximum size ratio allowed for the visible window.
   * @returns The maximum size ratio (0–1).
   */
  getMaxSizeRatio(): number {
    if (!this.timeline) {
      return 1;
    }
    const { maxVisibleRange } = this.timeline.getOptions();
    const { totalRange } = this.getStore().get();
    return (1 / totalRange) * maxVisibleRange;
  }

  /**
   * Recompute the minimap state based on the timeline's current position and visible range.
   * @private
   */
  private recompute(): void {
    if (!this.timeline) return;

    const { totalRange } = this.getStore().get();
    const current = this.timeline.getStore().select((s) => s.current);
    const visibleRange = this.timeline.getVisibleRange();

    const visibleSizeRatio = (1 / totalRange) * visibleRange;
    const visibleStartRatio = (1 / totalRange) * current;

    this.getStore().update((prev) => ({
      ...prev,
      visibleStartRatio: Math.max(
        0,
        Math.min(1 - visibleSizeRatio, visibleStartRatio),
      ),
      visibleSizeRatio,
    }));
  }

  /**
   * Recompute the total range if a compute function is provided.
   * @private
   */
  private recomputeTotalRange(): void {
    if (!this.timeline || !this.options.computeTotalRange) return;
    const newTotalRange = this.options.computeTotalRange(this.timeline);
    if (typeof newTotalRange === "object") {
      this.setTotalRange(newTotalRange.range);
      this.setOverflowAmount(newTotalRange.overflow);
      return;
    }
    this.setTotalRange(newTotalRange);
    this.setOverflowAmount(undefined);
  }
}
