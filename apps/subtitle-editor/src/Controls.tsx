import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";
import { useSignalSelector } from "@ptl/signal-react";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import { useSubtitleEditor } from "./store";
import { BAR_HEIGHT } from "./App.tsx";
import styles from "./App.module.css";
import { formatTime } from "./utils/format.ts";

/**
 * Playback controls component.
 */
export const Controls: React.FC = () => {
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
    <ResizablePanels.Panel
      defaultSize={BAR_HEIGHT}
      minSize={BAR_HEIGHT}
      disabled
      className={styles.panel}
    >
      <div className={styles.controls}>
        <span className={styles.timeDisplay}>
          {formatTime(position)} / {formatTime(duration * 1000)}
        </span>
        {media && (
          <span className={styles.mediaInfo}>
            {media.metadata.width}×{media.metadata.height}
          </span>
        )}
      </div>
    </ResizablePanels.Panel>
  );
};