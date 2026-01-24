import React from "react";

import { isEqual } from "es-toolkit";
import { useTimeline } from "./TimelineProvider.tsx";
import { Timeline } from "@ptl/timeline-core";

const select = (timeline: Timeline) => {
  const viewportStore = timeline.getViewport().getStore();
  const viewportWidthPx = viewportStore.select((s) => s.widthPx);
  return {
    translatePx: timeline.getTranslatePx(),
    chunkWidthPx: timeline.getChunkWidthPx(),
    viewportWidthPx,
    zoom: timeline.getZoomLevel(),
    visibleRange: viewportStore.select((s) => s.visibleRange),
    chunkRange: timeline.getStore().select((s) => s.chunkDuration),
  };
};

export const useViewport = () => {
  const timeline = useTimeline();
  const latestRef = React.useRef(select(timeline));

  const selectWithMemo = React.useCallback((tl: Timeline) => {
    const selected = select(tl);
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
