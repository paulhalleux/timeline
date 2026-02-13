import * as React from "react";
import { Track, useTimeline, ViewportItem } from "@ptl/timeline-react";
import { SelectionModule } from "@ptl/timeline-core";
import { useSignal } from "@ptl/signal-react";
import type { SubtitleTrack } from "../../types";
import styles from "./TimelineComponents.module.css";

interface SubtitleTrackComponentProps {
  track: SubtitleTrack;
}

/**
 * Renders a single subtitle track with its cues.
 */
export const SubtitleTrackComponent: React.FC<SubtitleTrackComponentProps> = ({
  track,
}) => {
  const timeline = useTimeline();
  const selectionModule = SelectionModule.for(timeline);
  const selectedIds = useSignal(
    selectionModule.getStore().map((s) => s.selectedIds),
  );

  const handleCueClick = React.useCallback(
    (cueId: string) => {
      if (selectedIds.has(cueId)) {
        selectionModule.deselect(cueId);
      } else {
        selectionModule.select(cueId);
      }
    },
    [selectedIds, selectionModule],
  );

  return (
    <Track.Root height={40} className={styles.trackRoot}>
      <Track.Header className={styles.trackHeader}>{track.label}</Track.Header>
      <Track.Content>
        {track.document.getCues().map((cue) => {
          const cueId = cue.start.raw;
          const isSelected = selectedIds.has(cueId);

          return (
            <ViewportItem
              key={cueId}
              start={cue.start.milliseconds}
              end={cue.end.milliseconds}
              className={`${styles.cue} ${isSelected ? styles.cueSelected : ""}`}
              onClick={() => handleCueClick(cueId)}
            >
              <span className={styles.cueText}>{cue.text}</span>
            </ViewportItem>
          );
        })}
      </Track.Content>
    </Track.Root>
  );
};
