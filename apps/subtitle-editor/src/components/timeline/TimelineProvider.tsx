import * as React from "react";
import { TimelineProvider } from "@ptl/timeline-react";
import { createTimelineInstance, type TimelineConfig } from "./instance.ts";

/**
 * Provider component that creates and manages timeline instance.
 */
export const TimelineInstanceProvider: React.FC<{
  config?: TimelineConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  const [timeline] = React.useState(() => createTimelineInstance(config));
  return <TimelineProvider timeline={timeline}>{children}</TimelineProvider>;
};
