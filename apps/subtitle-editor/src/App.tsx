import {
  PlayheadModule,
  RulerModule,
  Timeline,
  ViewportDragModule,
} from "@ptl/timeline-core";
import { TimelineProvider } from "@ptl/timeline-react";
import React from "react";

import { SubtitleEditor } from "./components/app/subtitle-editor.tsx";

export const App = () => {
  const [timeline] = React.useState(
    () =>
      new Timeline({
        headerOffsetPx: 300,
        minVisibleRange: 1000 * 5,
        maxVisibleRange: 1000 * 60 * 60,
        visibleRange: 1000 * 5,
        modules: [
          new RulerModule(),
          new ViewportDragModule(),
          new PlayheadModule(),
        ],
      }),
  );

  return (
    <TimelineProvider timeline={timeline}>
      <SubtitleEditor />
    </TimelineProvider>
  );
};
