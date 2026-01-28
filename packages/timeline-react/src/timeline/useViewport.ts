import React from "react";

import { isEqual } from "es-toolkit";
import { useTimeline } from "./TimelineProvider.tsx";
import { Timeline, type TimelineApi } from "@ptl/timeline-core";
import { useTimelineStore } from "./useTimelineStore.ts";

const selectViewport = (timeline: Timeline) => {
  const viewportStore = timeline.getViewport().getStore();
  return {
    viewportWidthPx: viewportStore.select((s) => s.widthPx),
    chunkWidthPx: timeline.getChunkWidthPx(),
    zoom: timeline.getZoomLevel(),
    visibleRange: viewportStore.select((s) => s.visibleRange),
    chunkRange: timeline.getStore().select((s) => s.chunkDuration),
  };
};

export const useViewport = () => {
  const timeline = useTimeline();
  const latestRef = React.useRef(selectViewport(timeline));

  const selectWithMemo = React.useCallback((tl: Timeline) => {
    const selected = selectViewport(tl);
    if (isEqual(latestRef.current, selected)) {
      return latestRef.current;
    } else {
      latestRef.current = selected;
      return selected;
    }
  }, []);

  return React.useSyncExternalStore(
    (onStoreChange) => timeline.getStore().subscribe(onStoreChange),
    () => selectWithMemo(timeline),
    () => selectWithMemo(timeline),
  );
};

const selectTimelineTranslate = (tl: TimelineApi) => tl.getTranslatePx();
export const useTimelineTranslate = () => {
  return useTimelineStore(selectTimelineTranslate);
};
