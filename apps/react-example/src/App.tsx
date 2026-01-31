import {
  MinimapModule,
  PlayheadModule,
  RulerModule,
  Timeline as TimelineCore,
  ViewportDragModule,
} from "@ptl/timeline-core";
import { TimelineProvider } from "@ptl/timeline-react";
import React from "react";

import { Example3 } from "./example-subtitle/example3.tsx";

export const App = () => {
  const [timeline] = React.useState(() => {
    const timeline = new TimelineCore({
      minVisibleRange: 50000,
      maxVisibleRange: 1000000,
      chunkSize: 10,
      headerOffsetPx: 300,
    });

    timeline.registerModule(new RulerModule());
    timeline.registerModule(new PlayheadModule());
    timeline.registerModule(
      new MinimapModule({
        initialTotalRange: 2000000,
        computeTotalRange: (timeline) => {
          const current = timeline.getBounds().start;
          const overflow = 2000000 - timeline.getVisibleRange();
          const range = 2000000 + (current > overflow ? current - overflow : 0);
          return { range, overflow: Math.max(0, range - 2000000) };
        },
      }),
    );
    timeline.registerModule(new ViewportDragModule());

    return timeline;
  });

  return (
    <TimelineProvider timeline={timeline}>
      <Example3 />
    </TimelineProvider>
  );
};
