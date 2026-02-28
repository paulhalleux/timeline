import { Store } from "@ptl/store";

import { type TimelineApi } from "../timeline";
import { type TimelineModule } from "../timeline-module";

export type WaveformState = {
  /** Normalized peak amplitudes (0 to 1) */
  peaks: Float32Array | null;
  /** Duration of the audio in milliseconds */
  duration: number;
};

export type WaveformApi = {
  getStore(): Store<WaveformState>;
  setPeaks(peaks: Float32Array, duration: number): void;
  getPeaks(): Float32Array | null;
  getDuration(): number;
  /**
   * Get the peaks for a given time range, returning one peak per pixel.
   * @param startMs - Start time in ms
   * @param endMs - End time in ms
   * @param widthPx - Width in pixels to map to
   * @returns Array of peak values, one per pixel
   */
  getPeaksForRange(startMs: number, endMs: number, widthPx: number): number[];
};

/**
 * WaveformModule stores and provides audio waveform peak data for rendering on the timeline.
 */
export class WaveformModule implements TimelineModule<WaveformApi> {
  static id = "WaveformModule";

  private readonly store: Store<WaveformState>;

  constructor() {
    this.store = new Store<WaveformState>({
      peaks: null,
      duration: 0,
    });
  }

  /**
   * Gets the WaveformModule instance from the given TimelineApi.
   */
  static for(timeline: TimelineApi): WaveformModule {
    return timeline.getModule(this);
  }

  attach(): void {}
  detach(): void {}

  getStore(): Store<WaveformState> {
    return this.store;
  }

  setPeaks(peaks: Float32Array, duration: number): void {
    this.store.set({
      peaks,
      duration,
    });
  }

  getPeaks(): Float32Array | null {
    return this.store.get().peaks;
  }

  getDuration(): number {
    return this.store.get().duration;
  }

  getPeaksForRange(startMs: number, endMs: number, widthPx: number): number[] {
    const { peaks, duration } = this.store.get();
    if (!peaks || duration <= 0 || widthPx <= 0) return [];

    const totalSamples = peaks.length;
    const result: number[] = new Array(Math.ceil(widthPx));

    for (let px = 0; px < result.length; px++) {
      // Map this pixel to a time range
      const t0 = startMs + (px / widthPx) * (endMs - startMs);
      const t1 = startMs + ((px + 1) / widthPx) * (endMs - startMs);

      // Map time range to sample indices
      const s0 = Math.max(0, Math.floor((t0 / duration) * totalSamples));
      const s1 = Math.min(
        totalSamples - 1,
        Math.ceil((t1 / duration) * totalSamples),
      );

      // Find the max peak in this sample range
      let max = 0;
      for (let s = s0; s <= s1; s++) {
        const val = Math.abs(peaks[s]);
        if (val > max) max = val;
      }
      result[px] = max;
    }

    return result;
  }
}
