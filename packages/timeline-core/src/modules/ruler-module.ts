import type { TimelineModule } from "../timeline-module";
import { TimelineApi } from "../timeline";
import { Store } from "@ptl/store";

export type RulerState = {
  prevIntervalTime: number;
  ticks: number[];
};

export type RulerOptions = {
  /**
   * Minimum pixel distance between ticks
   * @remarks This helps to avoid overcrowding of tick marks on the ruler.
   * @default 100
   */
  minTickIntervalPx?: number;
};

/**
 * RulerModule is responsible for calculating and managing the tick marks on the timeline ruler.
 * It computes tick positions based on the current view range and a specified minimum pixel distance between ticks.
 */
export class RulerModule implements TimelineModule {
  static id = "RulerModule";

  private readonly store: Store<RulerState>;

  private unsubscribers: Array<() => void> = [];
  private timeline?: TimelineApi;

  constructor(private readonly options: RulerOptions = {}) {
    this.store = new Store<RulerState>({
      prevIntervalTime: -1,
      ticks: [],
    });
  }

  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
    this.unsubscribers.push(
      timeline.subscribe(() => this.recompute()),
      timeline.getViewport().subscribe(() => this.recompute()),
    );
  }

  detach(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.timeline = undefined;
  }

  subscribe(listener: (state: RulerState) => void): () => void {
    return this.store.subscribe(listener);
  }

  getState(): RulerState {
    return this.store.getState();
  }

  private recompute(): void {
    if (!this.timeline) return;

    const start = this.timeline.select((state) => state.chunkStart);
    const end = start + this.timeline.getChunkRange();

    const interval = getTickIntervalTime(
      this.timeline.unitToPx.bind(this.timeline),
      this.options.minTickIntervalPx ?? 100,
    );

    this.store.setState(() => ({
      prevIntervalTime: interval,
      ticks: computeTicks(start, end, interval),
    }));
  }
}

/**
 * Generator function that yields a series of predefined duration values in milliseconds.
 * These durations range from milliseconds to years, providing a variety of options for tick intervals.
 * @returns A generator yielding duration values in milliseconds.
 */
function* getAvailableDurationMills(): Generator<number, void, unknown> {
  // milliseconds
  yield 100; // 100 milliseconds
  yield 500; // 500 milliseconds
  // seconds
  for (const number of [1, 2, 5, 10, 15, 20, 30]) {
    yield number * 1000;
  }
  // minutes
  for (const number of [1, 2, 5, 10, 15, 20, 30]) {
    yield number * 60 * 1000;
  }
  // hours
  for (const number of [1, 2, 3, 4, 6, 8, 12]) {
    yield number * 60 * 60 * 1000;
  }
  // days
  for (const number of [1, 2, 3, 4, 5, 6, 7]) {
    yield number * 24 * 60 * 60 * 1000;
  }
  // weeks
  for (const number of [1, 2, 3, 4, 5]) {
    yield number * 7 * 24 * 60 * 60 * 1000;
  }
  // months
  for (const number of [1, 2, 3, 4, 5]) {
    yield number * 30 * 24 * 60 * 60 * 1000;
  }
  // years
  for (const number of [1, 2, 3, 4, 5]) {
    yield number * 365 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Determines the appropriate tick interval time based on the unit-to-pixel conversion and expected width.
 * @param unitToPx - A function that converts time units to pixels.
 * @param expectedWidth - The minimum pixel distance between ticks.
 * @returns The selected tick interval time.
 */
function getTickIntervalTime(
  unitToPx: (time: number) => number,
  expectedWidth: number,
): number {
  for (const duration of getAvailableDurationMills()) {
    const width = unitToPx(duration);
    if (width >= expectedWidth) {
      return duration;
    }
  }
  return 0;
}

/**
 * Computes the tick positions within the specified range based on the given tick interval.
 * @param start - The start of the range.
 * @param end - The end of the range.
 * @param tickIntervalTime - The interval between ticks.
 * @returns An array of tick positions.
 */
function computeTicks(
  start: number,
  end: number,
  tickIntervalTime: number,
): number[] {
  const ticks: number[] = [];

  const firstTick = Math.ceil(start / tickIntervalTime) * tickIntervalTime;
  for (let t = firstTick; t < end; t += tickIntervalTime) {
    ticks.push(t);
  }
  return ticks;
}
