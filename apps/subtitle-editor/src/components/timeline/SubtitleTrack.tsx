import { useSignal } from "@ptl/signal-react";
import { PlaybackModule, SelectionModule } from "@ptl/subtitle-editor-core";
import type { SubtitleCue } from "@ptl/subtitle-kit";
import { Track, ViewportItem } from "@ptl/timeline-react";
import { CornerDownLeftIcon, CornerDownRightIcon } from "lucide-react";
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
  const selectionModule = SelectionModule.for(editor);
  const playbackModule = PlaybackModule.for(editor);
  const selectedCues = useSelectedCues(track.id);

  const handleCueClick = React.useCallback(
    (cue: SubtitleCue<any>, e: React.MouseEvent) => {
      const addToSelection = e.ctrlKey || e.metaKey;

      if (selectedCues.has(cue.index) && !addToSelection) {
        selectionModule.deselectCue(track.id, cue.index);
      } else {
        selectionModule.selectCue(track.id, cue.index, addToSelection);
      }

      if (e.shiftKey) {
        playbackModule.seek(cue.start.milliseconds);
      }
    },
    [selectionModule, playbackModule, track.id, selectedCues],
  );

  const cues = useSignal(track.document.getCuesSignal());

  return (
    <Track.Root height={40} className={styles.trackRoot}>
      <Track.Header className={styles.trackHeader}>{track.label}</Track.Header>
      <Track.Content>
        {cues.map((cue) => {
          const isSelected = selectedCues.has(cue.index);

          return (
            <ViewportItem
              key={`${track.id}-${cue.index}`}
              start={cue.start.milliseconds}
              end={cue.end.milliseconds}
              className={`${styles.cue} ${isSelected ? styles.cueSelected : ""}`}
              onClick={(e) => handleCueClick(cue, e)}
            >
              <span className={styles.cueText}>
                {cue.text.split("\n").map((line, i) => (
                  <React.Fragment key={line + i}>
                    {line}
                    {i < cue.text.split("\n").length - 1 && (
                      <>
                        <CornerDownLeftIcon
                          size={10}
                          className={styles.newlineIcon}
                        />
                        <br />
                        <CornerDownRightIcon
                          size={10}
                          className={styles.newlineIcon}
                        />
                      </>
                    )}
                  </React.Fragment>
                ))}
              </span>
            </ViewportItem>
          );
        })}
      </Track.Content>
    </Track.Root>
  );
};
