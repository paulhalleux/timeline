import { TimelineApi } from "../timeline";
import { TimelineModule } from "../timeline-module";
import { Store } from "@ptl/store";

export type MinimapState = {
  /** total duration represented by the minimap */
  totalRange: number;

  /** visible window start (0–1 ratio) */
  visibleStartRatio: number;

  /** visible window size (0–1 ratio) */
  visibleSizeRatio: number;
};

export type MinimapOptions = {
  initialTotalRange?: number;
  computeTotalRange?: (timeline: TimelineApi) => number;
};

export type MinimapApi = {
  setTotalRange(totalRange: number): void;
  setVisibleStartRatio(visibleStartRatio: number): void;
  setVisibleSizeRatio(visibleSizeRatio: number): void;
  moveCenterTo(leftDelta: number): void;
  extendVisibleRange(delta: number, side: "left" | "right"): void;
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

    const { visibleSizeRatio, totalRange } = this.getStore().get();
    const normalizedLeftDelta = Math.max(
      visibleSizeRatio / 2,
      Math.min(1 - visibleSizeRatio / 2, leftDelta),
    );

    const visibleRange = timeline.getVisibleRange();
    timeline.setCurrentPosition(
      totalRange * normalizedLeftDelta - visibleRange / 2,
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

    const { visibleSizeRatio, visibleStartRatio } = this.getStore().get();
    if (side === "right") {
      this.setVisibleSizeRatio(visibleSizeRatio + delta);
    } else {
      if (
        timeline.getVisibleRange() >= timeline.getOptions().maxVisibleRange ||
        timeline.getVisibleRange() <= timeline.getOptions().minVisibleRange
      ) {
        return;
      }

      const newVisibleSizeRatio = visibleSizeRatio + delta;
      const centerRatio = visibleStartRatio + visibleSizeRatio / 2;
      const newVisibleStartRatio = Math.max(
        0,
        Math.min(
          1 - newVisibleSizeRatio,
          centerRatio - newVisibleSizeRatio / 2,
        ),
      );

      this.setVisibleSizeRatio(newVisibleSizeRatio);
      this.setVisibleStartRatio(newVisibleStartRatio);
    }
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
    if (newTotalRange !== this.getStore().get().totalRange) {
      this.setTotalRange(newTotalRange);
    }
  }
}
