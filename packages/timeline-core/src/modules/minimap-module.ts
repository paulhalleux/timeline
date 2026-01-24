import { Store } from "@ptl/store";
import { TimelineApi } from "../timeline";

export type MinimapState = {
  timeline: TimelineApi | undefined;

  /** total duration represented by the minimap */
  totalRange: number;

  /** visible window start (0–1 ratio) */
  visibleStartRatio: number;

  /** visible window size (0–1 ratio) */
  visibleSizeRatio: number;
};

export class MinimapModule {
  private readonly store = new Store<MinimapState>({
    timeline: undefined,
    totalRange: 0,
    visibleStartRatio: 0,
    visibleSizeRatio: 1,
  });

  private unsubscribe?: () => void;
  private timeline?: TimelineApi;

  constructor(totalRange: number) {
    this.store.setState((s) => ({ ...s, totalRange }));
  }

  attach(timeline: TimelineApi): void {
    this.unsubscribe?.();
    this.timeline = timeline;
    this.unsubscribe = timeline.subscribe(() => {
      this.recomputeVisibleWindow();
    });
  }

  detach(): void {
    console.log("MinimapModule.detach");
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
    this.recomputeVisibleWindow();
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

  private recomputeVisibleWindow(): void {
    const timeline = this.timeline;
    if (!timeline) {
      return;
    }

    const total = this.store.select((s) => s.totalRange);
    const current = timeline.getStore().select((s) => s.current);
    const visibleRange = timeline.getVisibleRange();

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
