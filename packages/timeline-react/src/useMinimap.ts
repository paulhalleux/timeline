import { MinimapModule } from "@ptl/timeline-core";
import React from "react";
import { useTimeline } from "./TimelineProvider.tsx";

export const useMinimap = () => {
  const timeline = useTimeline();
  const minimap = timeline.getModule(MinimapModule);

  const state = React.useSyncExternalStore(
    (callback) => minimap.getStore().subscribe(callback),
    () => minimap.getStore().get(),
    () => minimap.getStore().get(),
  );

  return {
    api: minimap,
    state,
  };
};
