import {
  MinimapModule,
  PlayheadModule,
  RulerModule,
  SelectionModule,
  Timeline,
  ViewportDragModule,
} from "@ptl/timeline-core";

export interface TimelineConfig {
  minVisibleRange?: number;
  maxVisibleRange?: number;
  chunkSize?: number;
  headerOffsetPx?: number;
  initialTotalRange?: number;
}

const DEFAULT_CONFIG: Required<TimelineConfig> = {
  minVisibleRange: 25000,
  maxVisibleRange: 500000,
  chunkSize: 10,
  headerOffsetPx: 300,
  initialTotalRange: 2000000,
};

/**
 * Creates a configured timeline instance with all required modules.
 */
export const createTimelineInstance = (config: TimelineConfig = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  return new Timeline({
    minVisibleRange: mergedConfig.minVisibleRange,
    maxVisibleRange: mergedConfig.maxVisibleRange,
    chunkSize: mergedConfig.chunkSize,
    headerOffsetPx: mergedConfig.headerOffsetPx,
    modules: [
      new RulerModule(),
      new PlayheadModule(),
      new MinimapModule({
        initialTotalRange: mergedConfig.initialTotalRange,
      }),
      new ViewportDragModule(),
      new SelectionModule(),
    ],
  });
};
