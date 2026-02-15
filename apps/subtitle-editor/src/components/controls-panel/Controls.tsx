import { PlaybackModule } from "@ptl/subtitle-editor-core";
import {
  BookmarkIcon,
  MessageSquareIcon,
  PauseIcon,
  PlayIcon,
  Redo2Icon,
  Undo2Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import * as React from "react";

import {
  type MarkerType,
  useCurrentTime,
  useEditor,
  useHistory,
  useMedia,
  usePlayback,
} from "../../core";
import { formatTime } from "../../utils/format.ts";
import { Button } from "../ui";
import styles from "./Controls.module.css";

// ============================================================================
// Marker Type Config
// ============================================================================

const MARKER_TYPES: {
  type: MarkerType;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}[] = [
  {
    type: "bookmark",
    icon: <BookmarkIcon size={14} />,
    label: "Bookmark",
    shortcut: "B",
  },
  {
    type: "note",
    icon: <MessageSquareIcon size={14} />,
    label: "Note",
    shortcut: "N",
  },
];

// ============================================================================
// Controls Component
// ============================================================================

export const Controls: React.FC = () => {
  const editor = useEditor();
  const playbackModule = PlaybackModule.for(editor);
  const media = useMedia();
  const playback = usePlayback();
  const currentTime = useCurrentTime();
  const history = useHistory();

  const duration = media?.metadata.duration ?? 0;

  const handleAddMarker = React.useCallback(
    (type: MarkerType) => {
      editor.addMarkerAtCurrentTime(type);
    },
    [editor],
  );

  const handleTogglePlayPause = React.useCallback(() => {
    playbackModule.togglePlayPause();
  }, [playbackModule]);

  const handleToggleMute = React.useCallback(() => {
    playbackModule.toggleMute();
  }, [playbackModule]);

  return (
    <div className={styles.controls}>
      {/* Play/Pause */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleTogglePlayPause}
        title={playback.isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {playback.isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </Button>

      {/* Time Display */}
      <span className={styles.timeDisplay}>
        {formatTime(currentTime)} / {formatTime(duration * 1000)}
      </span>

      {/* Volume/Mute */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleMute}
        active={playback.isMuted}
        title={playback.isMuted ? "Unmute (M)" : "Mute (M)"}
      >
        {playback.isMuted ? (
          <VolumeXIcon size={16} />
        ) : (
          <Volume2Icon size={16} />
        )}
      </Button>

      {/* Separator */}
      <div className={styles.controlsSeparator} />

      {/* Marker Buttons */}
      {MARKER_TYPES.map(({ type, icon, label, shortcut }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => handleAddMarker(type)}
          title={`Add ${label} (Shift+${shortcut})`}
        >
          {icon}
        </Button>
      ))}

      {/* Separator */}
      <div className={styles.controlsSeparator} />

      {/* History */}
      <div className={styles.historyButtons}>
        <Button
          variant="ghost"
          size="sm"
          onClick={history.undo}
          disabled={!history.canUndo}
          className={styles.historyButton}
          title="Undo (Ctrl+Z)"
        >
          <Undo2Icon size={16} />
          {history.past.length > 0 && (
            <span className={styles.historyCount}>{history.past.length}</span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={history.redo}
          disabled={!history.canRedo}
          className={styles.historyButton}
          title="Redo (Ctrl+Y)"
        >
          <Redo2Icon size={16} />
          {history.future.length > 0 && (
            <span className={styles.historyCount}>{history.future.length}</span>
          )}
        </Button>
      </div>

      {/* Media Info */}
      {media && (
        <span className={styles.mediaInfo}>
          {media.metadata.width}×{media.metadata.height} • {media.filename}
        </span>
      )}
    </div>
  );
};
