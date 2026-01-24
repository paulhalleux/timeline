import { Store } from "@ptl/store";
import { TimelineApi } from "../timeline";

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
};

export class MinimapModule {
  private readonly store: Store<MinimapState>;

  private unsubscribe?: () => void;
  private timeline?: TimelineApi;

  constructor(options: MinimapOptions = {}) {
    this.store = new Store<MinimapState>({
      totalRange: options.initialTotalRange ?? 10000,
      visibleStartRatio: 0,
      visibleSizeRatio: 0,
    });
  }

  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
    this.unsubscribe = timeline.subscribe(() => {
      this.recompute();
    });
  }

  detach(): void {
    this.timeline = undefined;
    this.unsubscribe?.();
  }

  subscribe(listener: (state: MinimapState) => void): () => void {
    return this.store.subscribe(listener);
  }

  getState(): MinimapState {
    return this.store.getState();
  }

  setTotalRange(totalRange: number): void {
    this.store.setState((prev) => ({
      ...prev,
      totalRange,
    }));
    this.recompute();
  }

  setVisibleStartRatio(visibleStartRatio: number): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const normalizedVisibleStartRatio = Math.max(
      0,
      Math.min(
        1 - this.store.select((s) => s.visibleSizeRatio),
        visibleStartRatio,
      ),
    );

    const totalRange = this.store.select((s) => s.totalRange);
    timeline.setCurrentPosition(totalRange * normalizedVisibleStartRatio);
  }

  moveCenterTo(leftDelta: number): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const sizeRatio = this.store.select((s) => s.visibleSizeRatio);
    const normalizedLeftDelta = Math.max(
      sizeRatio / 2,
      Math.min(1 - sizeRatio / 2, leftDelta),
    );

    const totalRange = this.store.select((s) => s.totalRange);
    const visibleRange = timeline.getVisibleRange();
    timeline.setCurrentPosition(
      totalRange * normalizedLeftDelta - visibleRange / 2,
    );
  }

  private recompute(): void {
    if (!this.timeline) return;

    const total = this.store.select((s) => s.totalRange);
    const current = this.timeline.getStore().select((s) => s.current);
    const visibleRange = this.timeline.getVisibleRange();

    const visibleSizeRatio = (1 / total) * visibleRange;
    const visibleStartRatio = (1 / total) * current;

    this.store.setState((prev) => ({
      ...prev,
      visibleStartRatio: Math.max(
        0,
        Math.min(1 - visibleSizeRatio, visibleStartRatio),
      ),
      visibleSizeRatio,
    }));
  }
}
