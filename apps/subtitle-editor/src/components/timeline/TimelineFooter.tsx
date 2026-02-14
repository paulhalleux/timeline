import { Minimap, Panner, useTimeline } from "@ptl/timeline-react";
import React from "react";

import styles from "./TimelineComponents.module.css";

export const TimelineFooter: React.FC = () => {
  const timeline = useTimeline();
  return (
    <div className={styles.footer}>
      <div className={styles.footerWidgetContainer}>
        <Minimap.Root
          style={{
            height: "100%",
            position: "relative",
          }}
        >
          <Minimap.Thumb minWidth={40} className={styles.minimapThumb}>
            <Minimap.ResizeHandle
              className={styles.minimapResizeHandle}
              position="left"
            />
            <Minimap.ResizeHandle
              className={styles.minimapResizeHandle}
              position="right"
            />
          </Minimap.Thumb>
        </Minimap.Root>
      </div>
      <div className={styles.footerWidgetContainer}>
        <div className={styles.pannerBar} />
        <Panner.Root
          style={{
            width: "100%",
            height: "100%",
          }}
          onPan={(delta) => {
            timeline.panByPx(delta * 100);
          }}
        >
          <Panner.Handle className={styles.panHandle} />
        </Panner.Root>
      </div>
    </div>
  );
};
