import * as React from "react";
import { Ruler, useTimeline } from "@ptl/timeline-react";
import styles from "./TimelineComponents.module.css";
import { formatTime } from "../../utils/format.ts";
import { useSubtitleEditor } from "../../store";
import { useSignalSelector } from "@ptl/signal-react";
import { PlayheadModule } from "@ptl/timeline-core";

/**
 * Timeline ruler component displaying time markers.
 */
export const TimelineRuler: React.FC = () => {
  const { store } = useSubtitleEditor();
  const timeline = useTimeline();

  const media = useSignalSelector(([state]) => state.media, [store] as const);
  const playhead = PlayheadModule.for(timeline);
  const position = useSignalSelector(
    ([state]) => state.position,
    [playhead.getStore()] as const
  );

  const duration = media?.metadata.duration ?? 0;

  return (
    <Ruler.Root className={styles.ruler}>
      <Ruler.Header className={styles.rulerHeader}>
        <div className={styles.timeDisplay}>
          {formatTime(position)} / {formatTime(duration * 1000)}
        </div>
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
