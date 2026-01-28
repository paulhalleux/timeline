import React from "react";

import {
  MinimapModule,
  type MinimapApi,
  type MinimapState,
} from "@ptl/timeline-core";

import { useTimeline } from "../../TimelineProvider.tsx";

/**
 * Hook to access the minimap module and its state within the timeline.
 *
 * @returns An object containing the minimap API and its current state.
 */
export const useMinimap = (): [MinimapState, MinimapApi] => {
  const timeline = useTimeline();
  const minimap = timeline.getModule(MinimapModule);

  const state = React.useSyncExternalStore(
    (callback) => minimap.getStore().subscribe(callback),
    () => minimap.getStore().get(),
    () => minimap.getStore().get(),
  );

  return [state, minimap];
};
