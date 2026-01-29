import { type Timeline } from "@ptl/timeline-core";
import React from "react";

import { useTimeline } from "./TimelineProvider.tsx";

/**
 * Hook to select and subscribe to specific parts of the timeline store.
 *
 * @param selector - A function that selects a part of the timeline.
 * @returns The selected part of the timeline.
 */
export const useTimelineStore = <TSelected>(
  selector: (timeline: Timeline) => TSelected,
): TSelected => {
  const timeline = useTimeline();
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const unsubTimeline = timeline.subscribe(onStoreChange);
      const unsubViewport = timeline.getViewport().subscribe(onStoreChange);
      return () => {
        unsubTimeline();
        unsubViewport();
      };
    },
    () => selector(timeline),
    () => selector(timeline),
  );
};
