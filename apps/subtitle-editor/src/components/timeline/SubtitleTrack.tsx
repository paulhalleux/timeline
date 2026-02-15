import { useSignal } from "@ptl/signal-react";
import { PlaybackModule, SelectionModule } from "@ptl/subtitle-editor-core";
import type { SubtitleCue } from "@ptl/subtitle-kit";
import { Track } from "@ptl/timeline-react";
import { clsx } from "clsx";
import { CornerDownLeftIcon, CornerDownRightIcon } from "lucide-react";
import * as React from "react";

import {
  type SubtitleTrack,
  useActiveTrackId,
  useEditor,
  useSelectedCues,
} from "../../core";
import { DraggableCue } from "./DraggableCue";
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
  const isTrackActive = useActiveTrackId() === track.id;

  const handleCueClick = React.useCallback(
    (cue: SubtitleCue<any>, e: React.MouseEvent) => {
      const addToSelection = e.ctrlKey || e.metaKey;

      if (selectedCues.has(cue.id) && !addToSelection) {
        selectionModule.deselectCue(track.id, cue.id);
      } else {
        selectionModule.selectCue(track.id, cue.id, addToSelection);
      }

      if (e.shiftKey) {
        playbackModule.seek(cue.start.milliseconds);
      }
    },
    [selectionModule, playbackModule, track.id, selectedCues],
  );

  const cues = useSignal(track.document.getCuesSignal());

  return (
    <Track.Root
      height={40}
      className={clsx(styles.trackRoot, {
        [styles.activeTrack]: isTrackActive,
      })}
    >
      <Track.Header className={styles.trackHeader}>{track.label}</Track.Header>
      <Track.Content>
        {cues.map((cue) => {
          const isSelected = selectedCues.has(cue.id);
          const sliced = cue.text.split("\n").slice(0, 2);

          return (
            <DraggableCue
              key={`${track.id}-${cue.index}`}
              trackId={track.id}
              cue={cue}
              className={`${styles.cue} ${isSelected ? styles.cueSelected : ""}`}
              onClick={(e) => handleCueClick(cue, e)}
            >
              <span className={styles.cueText}>
                {sliced.map((line, i) => (
                  <React.Fragment key={line + i}>
                    {line}
                    {i < sliced.length - 1 && (
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
            </DraggableCue>
          );
        })}
      </Track.Content>
    </Track.Root>
  );
};
