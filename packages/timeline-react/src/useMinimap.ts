import { MinimapModule } from "@ptl/timeline-core";
import React from "react";

export const useMinimap = (minimap: MinimapModule) => {
  return React.useSyncExternalStore(
    (callback) => minimap.subscribe(callback),
    () => minimap.getState(),
    () => minimap.getState(),
  );
};
