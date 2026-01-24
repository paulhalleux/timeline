/* eslint-disable react-refresh/only-export-components */
import React from "react";

import { Timeline } from "@ptl/timeline-core";

export const TimelineContext = React.createContext<Timeline | null>(null);

export const TimelineProvider: React.FC<
  React.PropsWithChildren<{ timeline: Timeline }>
> = ({ timeline, children }) => {
  return (
    <TimelineContext.Provider value={timeline}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = (): Timeline => {
  const timeline = React.useContext(TimelineContext);
  if (!timeline) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return timeline;
};
