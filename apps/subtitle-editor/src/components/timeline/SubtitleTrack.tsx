import { Track, ViewportItem } from "@ptl/timeline-react";
import * as React from "react";

import { type SubtitleTrack, useEditor, useSelectedCues } from "../../core";
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
  const editor = useEditor();
  const selectedCues = useSelectedCues(track.id);

  const handleCueClick = React.useCallback(
    (cueIndex: number, e: React.MouseEvent) => {
      const addToSelection = e.shiftKey || e.ctrlKey || e.metaKey;

      if (selectedCues.has(cueIndex) && !addToSelection) {
        editor.selection.deselectCue(track.id, cueIndex);
      } else {
        editor.selection.selectCue(track.id, cueIndex, addToSelection);
      }

      // Seek to cue start
      const cue = track.document.getCues()[cueIndex];
      if (cue) {
        editor.playback.seek(cue.start.milliseconds);
      }
    },
    [editor, track.id, track.document, selectedCues],
  );

  return (
    <Track.Root height={40} className={styles.trackRoot}>
      <Track.Header className={styles.trackHeader}>{track.label}</Track.Header>
      <Track.Content>
        {track.document.getCues().map((cue, index) => {
          const isSelected = selectedCues.has(index);

          return (
            <ViewportItem
              key={`${track.id}-${index}`}
              start={cue.start.milliseconds}
              end={cue.end.milliseconds}
              className={`${styles.cue} ${isSelected ? styles.cueSelected : ""}`}
              onClick={(e) => handleCueClick(index, e)}
            >
              <span className={styles.cueText}>{cue.text}</span>
            </ViewportItem>
          );
        })}
      </Track.Content>
    </Track.Root>
  );
};
