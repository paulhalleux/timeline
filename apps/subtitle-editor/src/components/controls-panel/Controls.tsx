import {
  BookmarkIcon,
  FlagIcon,
  MessageSquareIcon,
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import * as React from "react";

import {
  type MarkerType,
  useCurrentTime,
  useEditor,
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
    type: "chapter",
    icon: <FlagIcon size={14} />,
    label: "Chapter",
    shortcut: "C",
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
  const media = useMedia();
  const playback = usePlayback();
  const currentTime = useCurrentTime();

  const duration = media?.metadata.duration ?? 0;

  const handleAddMarker = React.useCallback(
    (type: MarkerType) => {
      editor.addMarkerAtCurrentTime(type);
    },
    [editor],
  );

  const handleTogglePlayPause = React.useCallback(() => {
    editor.playback.togglePlayPause();
  }, [editor]);

  const handleToggleMute = React.useCallback(() => {
    editor.playback.toggleMute();
  }, [editor]);

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

      {/* Media Info */}
      {media && (
        <span className={styles.mediaInfo}>
          {media.metadata.width}×{media.metadata.height} • {media.filename}
        </span>
      )}
    </div>
  );
};
