import { Playhead } from "@ptl/timeline-react";
import * as React from "react";

import styles from "./TimelineComponents.module.css";

/**
 * Timeline playhead component showing current playback position.
 */
export const TimelinePlayhead: React.FC = () => {
  return (
    <Playhead.Root>
      <Playhead.Head className={styles.playheadHead} />
      <Playhead.Bar className={styles.playheadBar} />
      <Playhead.Handle />
    </Playhead.Root>
  );
};
