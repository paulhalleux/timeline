import {
  ClockIcon,
  CopyIcon,
  LayersIcon,
  PlayIcon,
  TextIcon,
  Trash2Icon,
} from "lucide-react";
import React from "react";

import {
  useActiveTrackId,
  useEditor,
  useSelection,
  useTracks,
} from "../../core";
import { formatTime } from "../../utils/format";
import { Button } from "../ui";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import styles from "./CueEditor.module.css";

// ============================================================================
// Time Input Component
// ============================================================================

interface TimeInputProps {
  label: string;
  value: number; // milliseconds
  onChange: (ms: number) => void;
  min?: number;
  max?: number;
}

const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = Infinity,
}) => {
  const [inputValue, setInputValue] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Format milliseconds to HH:MM:SS.mmm
  const formatMs = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
  };

  // Parse time string to milliseconds
  const parseTime = (str: string): number | null => {
    // Try HH:MM:SS.mmm format
    const fullMatch = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/);
    if (fullMatch) {
      const [, h, m, s, ms] = fullMatch;
      return (
        parseInt(h) * 3600000 +
        parseInt(m) * 60000 +
        parseInt(s) * 1000 +
        parseInt(ms.padEnd(3, "0"))
      );
    }

    // Try MM:SS.mmm format
    const shortMatch = str.match(/^(\d{1,2}):(\d{2})\.(\d{1,3})$/);
    if (shortMatch) {
      const [, m, s, ms] = shortMatch;
      return (
        parseInt(m) * 60000 + parseInt(s) * 1000 + parseInt(ms.padEnd(3, "0"))
      );
    }

    // Try MM:SS format
    const simpleMatch = str.match(/^(\d{1,2}):(\d{2})$/);
    if (simpleMatch) {
      const [, m, s] = simpleMatch;
      return parseInt(m) * 60000 + parseInt(s) * 1000;
    }

    // Try seconds only
    const secondsMatch = str.match(/^(\d+(?:\.\d+)?)$/);
    if (secondsMatch) {
      return Math.round(parseFloat(secondsMatch[1]) * 1000);
    }

    return null;
  };

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(formatMs(value));
      setHasError(false);
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseTime(inputValue);
    if (parsed !== null && parsed >= min && parsed <= max) {
      onChange(parsed);
      setHasError(false);
    } else {
      setInputValue(formatMs(value));
      setHasError(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const parsed = parseTime(newValue);
    setHasError(parsed === null || parsed < min || parsed > max);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setInputValue(formatMs(value));
      setHasError(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={styles.timeField}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type="text"
        className={`${styles.timeInput} ${hasError ? styles.timeInputError : ""}`}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

// ============================================================================
// Single Cue Editor
// ============================================================================

interface SingleCueEditorProps {
  trackId: string;
  cueIndex: number;
}

const SingleCueEditor: React.FC<SingleCueEditorProps> = ({
  trackId,
  cueIndex,
}) => {
  const editor = useEditor();
  const tracks = useTracks();
  const track = tracks.find((t) => t.id === trackId);
  const cue = track?.document.getCues().find((c) => c.index === cueIndex);

  const [localText, setLocalText] = React.useState(cue?.text ?? "");
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync local text with cue
  React.useEffect(() => {
    if (cue) {
      setLocalText(cue.text);
    }
  }, [cue]);

  if (!track || !cue) {
    return (
      <EmptyState
        icon={<TextIcon size={48} />}
        title="Cue Not Found"
        description="The selected cue could not be found."
      />
    );
  }

  const duration = cue.end.milliseconds - cue.start.milliseconds;
  const charCount = localText.length;
  const lineCount = localText.split("\n").length;

  // Character per second (reading speed)
  const cps = duration > 0 ? (charCount / duration) * 1000 : 0;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
  };

  const handleTextBlur = () => {
    if (localText !== cue.text) {
      editor.tracks.updateCue(trackId, cueIndex, { text: localText });
    }
  };

  const handleStartChange = (startMs: number) => {
    // Ensure start is before end
    if (startMs < cue.end.milliseconds) {
      editor.tracks.updateCue(trackId, cueIndex, { startMs });
    }
  };

  const handleEndChange = (endMs: number) => {
    // Ensure end is after start
    if (endMs > cue.start.milliseconds) {
      editor.tracks.updateCue(trackId, cueIndex, { endMs });
    }
  };

  const handlePlayCue = () => {
    editor.playback.seek(cue.start.milliseconds);
    editor.playback.play();
  };

  const handleGoToStart = () => {
    editor.playback.seek(cue.start.milliseconds);
  };

  const handleSetStartToPlayhead = () => {
    const currentTime = editor.playback.getCurrentTime();
    if (currentTime < cue.end.milliseconds) {
      editor.tracks.updateCue(trackId, cueIndex, { startMs: currentTime });
    }
  };

  const handleSetEndToPlayhead = () => {
    const currentTime = editor.playback.getCurrentTime();
    if (currentTime > cue.start.milliseconds) {
      editor.tracks.updateCue(trackId, cueIndex, { endMs: currentTime });
    }
  };

  const handleDeleteCue = () => {
    if (confirm("Are you sure you want to delete this cue?")) {
      editor.tracks.deleteCue(trackId, cueIndex);
      editor.selection.clearCueSelection(trackId);
    }
  };

  const handleDuplicateCue = () => {
    editor.tracks.insertCue(
      trackId,
      cue.end.milliseconds,
      cue.end.milliseconds + duration,
      cue.text,
      cueIndex + 1,
    );
  };

  // Determine character count status
  let charCountClass = styles.charCount;
  if (cps > 25) {
    charCountClass = `${styles.charCount} ${styles.charCountError}`;
  } else if (cps > 20) {
    charCountClass = `${styles.charCount} ${styles.charCountWarning}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <TextIcon size={16} />
          <span>Cue #{cueIndex + 1}</span>
        </div>
        <span className={styles.headerBadge}>{track.label}</span>
      </div>

      <div className={styles.content}>
        {/* Text Content */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Text Content</label>
          <textarea
            ref={textAreaRef}
            className={styles.textArea}
            value={localText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            placeholder="Enter subtitle text..."
            rows={4}
          />
          <div className={charCountClass}>
            {charCount} chars • {lineCount} line{lineCount !== 1 ? "s" : ""} •{" "}
            {cps.toFixed(1)} chars/sec
          </div>
        </div>

        {/* Timing */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Timing</label>
          <div className={styles.timeRow}>
            <TimeInput
              label="Start"
              value={cue.start.milliseconds}
              onChange={handleStartChange}
              max={cue.end.milliseconds - 1}
            />
            <TimeInput
              label="End"
              value={cue.end.milliseconds}
              onChange={handleEndChange}
              min={cue.start.milliseconds + 1}
            />
          </div>
          <div className={styles.durationDisplay}>
            <ClockIcon size={14} />
            <span className={styles.durationLabel}>Duration:</span>
            <span className={styles.durationValue}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Quick Actions</label>
          <div className={styles.quickActions}>
            <Button variant="ghost" size="sm" onClick={handlePlayCue}>
              <PlayIcon size={14} />
              Play
            </Button>
            <Button variant="ghost" size="sm" onClick={handleGoToStart}>
              <ClockIcon size={14} />
              Go to Start
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSetStartToPlayhead}
            >
              Set Start
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSetEndToPlayhead}>
              Set End
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={handleDuplicateCue}>
            <CopyIcon size={14} />
            Duplicate
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteCue}>
            <Trash2Icon size={14} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Multiple Cue Selection
// ============================================================================

interface MultipleCueEditorProps {
  trackId: string;
  cueIndices: number[];
}

const MultipleCueEditor: React.FC<MultipleCueEditorProps> = ({
  trackId,
  cueIndices,
}) => {
  const editor = useEditor();
  const tracks = useTracks();
  const track = tracks.find((t) => t.id === trackId);

  if (!track) return null;

  const handleDeleteAll = () => {
    if (confirm(`Delete ${cueIndices.length} selected cues?`)) {
      // Delete in reverse order to maintain indices
      const sorted = [...cueIndices].sort((a, b) => b - a);
      sorted.forEach((index) => {
        editor.tracks.deleteCue(trackId, index);
      });
      editor.selection.clearCueSelection(trackId);
    }
  };

  const handleShiftTiming = (offsetMs: number) => {
    cueIndices.forEach((index) => {
      const cue = track.document.getCues().find((c) => c.index === index);
      if (cue) {
        editor.tracks.updateCue(trackId, index, {
          startMs: Math.max(0, cue.start.milliseconds + offsetMs),
          endMs: cue.end.milliseconds + offsetMs,
        });
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <LayersIcon size={16} />
          <span>Multiple Cues</span>
        </div>
        <span className={styles.headerBadge}>{cueIndices.length} selected</span>
      </div>

      <div className={styles.content}>
        <div className={styles.multipleSelection}>
          <LayersIcon size={48} className={styles.multipleSelectionIcon} />
          <div className={styles.multipleSelectionTitle}>
            {cueIndices.length} Cues Selected
          </div>
          <div className={styles.multipleSelectionDescription}>
            Edit multiple cues at once
          </div>
        </div>

        {/* Batch Timing Adjustments */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Shift Timing</label>
          <div className={styles.quickActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShiftTiming(-1000)}
            >
              -1s
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShiftTiming(-100)}
            >
              -0.1s
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShiftTiming(100)}
            >
              +0.1s
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShiftTiming(1000)}
            >
              +1s
            </Button>
          </div>
        </div>

        {/* Batch Actions */}
        <div className={styles.actions}>
          <Button variant="danger" size="sm" onClick={handleDeleteAll}>
            <Trash2Icon size={14} />
            Delete All ({cueIndices.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Cue Editor
// ============================================================================

export const CueEditor: React.FC = () => {
  const selection = useSelection();
  const activeTrackId = useActiveTrackId();

  // Get selected cues for active track
  const selectedCues = activeTrackId
    ? selection.selectedCues.get(activeTrackId)
    : null;
  const selectedIndices = selectedCues ? Array.from(selectedCues) : [];

  // No selection
  if (selectedIndices.length === 0) {
    return (
      <EmptyState
        icon={<TextIcon size={48} />}
        title="No Cue Selected"
        description="Select a cue from the subtitle list or timeline to edit its properties."
      />
    );
  }

  // Single selection
  if (selectedIndices.length === 1 && activeTrackId) {
    return (
      <SingleCueEditor trackId={activeTrackId} cueIndex={selectedIndices[0]} />
    );
  }

  // Multiple selection
  if (activeTrackId) {
    return (
      <MultipleCueEditor trackId={activeTrackId} cueIndices={selectedIndices} />
    );
  }

  return null;
};
