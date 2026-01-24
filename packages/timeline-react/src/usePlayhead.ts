import { PlayheadModule } from "@ptl/timeline-core";
import React from "react";

export const usePlayhead = (playhead: PlayheadModule) => {
  return React.useSyncExternalStore(
    (callback) => playhead.subscribe(callback),
    () => playhead.getState(),
    () => playhead.getState(),
  );
};
