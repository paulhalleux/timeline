import { PlaybackModule, TrackModule } from "@ptl/subtitle-editor-core";
import type { SubtitleCue } from "@ptl/subtitle-kit";
import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  PlayIcon,
} from "lucide-react";
import React from "react";

import { useEditor } from "../../core";
import { Button, Tooltip } from "../ui";
import styles from "./CueEditor.module.css";

type QuickActionsProps = {
  trackId: string;
  cue: SubtitleCue<any>;
};

export const QuickActions: React.FC<QuickActionsProps> = ({ trackId, cue }) => {
  const editor = useEditor();
  const playbackModule = PlaybackModule.for(editor);
  const tracksModule = TrackModule.for(editor);

  const handlePlayCue = () => {
    playbackModule.seek(cue.start.milliseconds);
    playbackModule.play();
  };

  const handleGoToStart = () => {
    playbackModule.seek(cue.start.milliseconds);
  };

  const handleGoToEnd = () => {
    playbackModule.seek(cue.end.milliseconds);
  };

  const handleSetStartToPlayhead = () => {
    const currentTime = playbackModule.getCurrentTime();
    if (currentTime < cue.end.milliseconds) {
      tracksModule.updateCue(trackId, cue.index, { startMs: currentTime });
    }
  };

  const handleSetEndToPlayhead = () => {
    const currentTime = playbackModule.getCurrentTime();
    if (currentTime > cue.start.milliseconds) {
      tracksModule.updateCue(trackId, cue.index, { endMs: currentTime });
    }
  };

  return (
    <div className={styles.quickActions}>
      <Tooltip.Kbd label="Play Cue" shortcut="Space">
        <Button
          variant="ghost"
          size="sm"
          className={styles.iconAction}
          onClick={handlePlayCue}
        >
          <PlayIcon size={14} />
        </Button>
      </Tooltip.Kbd>
      <Tooltip.Kbd label="Go to Cue Start" shortcut="Home">
        <Button
          variant="ghost"
          size="sm"
          className={styles.iconAction}
          onClick={handleGoToStart}
        >
          <ArrowLeftToLineIcon size={14} />
        </Button>
      </Tooltip.Kbd>
      <Tooltip.Kbd label="Go to Cue End" shortcut="End">
        <Button
          variant="ghost"
          size="sm"
          className={styles.iconAction}
          onClick={handleGoToEnd}
        >
          <ArrowRightToLineIcon size={14} />
        </Button>
      </Tooltip.Kbd>
      <div className={styles.spacer} />
      <Tooltip.Kbd label="Set Start to Playhead" shortcut="Shift + S">
        <Button variant="ghost" size="sm" onClick={handleSetStartToPlayhead}>
          Set Start
        </Button>
      </Tooltip.Kbd>
      <Tooltip.Kbd label="Set End to Playhead" shortcut="Shift + E">
        <Button variant="ghost" size="sm" onClick={handleSetEndToPlayhead}>
          Set End
        </Button>
      </Tooltip.Kbd>
    </div>
  );
};
