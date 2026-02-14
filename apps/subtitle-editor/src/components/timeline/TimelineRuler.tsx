import { useSignalSelector } from "@ptl/signal-react";
import { PlayheadModule } from "@ptl/timeline-core";
import { Ruler, useTimeline } from "@ptl/timeline-react";
import * as React from "react";

import { useMedia } from "../../core";
import { formatTime } from "../../utils/format.ts";
import styles from "./TimelineComponents.module.css";

/**
 * Timeline ruler component displaying time markers.
 */
export const TimelineRuler: React.FC = () => {
  const timeline = useTimeline();

  const playhead = PlayheadModule.for(timeline);
  const position = useSignalSelector(([state]) => state.position, [
    playhead.getStore(),
  ] as const);

  const media = useMedia();

  return (
    <Ruler.Root className={styles.ruler}>
      <Ruler.Header className={styles.rulerHeader}>
        {media && (
          <div className={styles.timeDisplay}>
            {formatTime(position)} /{" "}
            {formatTime(media.metadata.duration * 1000)}
          </div>
        )}
      </Ruler.Header>
      <Ruler.Ticks>
        {({ unit, left, width }) => (
          <div className={styles.tickContainer} style={{ width, left }}>
            <div className={styles.tickLabel}>{formatTime(unit)}</div>
          </div>
        )}
      </Ruler.Ticks>
    </Ruler.Root>
  );
};
