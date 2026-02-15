import { useSignal } from "@ptl/signal-react";
import {
  HistoryModule,
  SelectionModule,
  TrackModule,
} from "@ptl/subtitle-editor-core";
import { clsx } from "clsx";
import { CopyIcon, TextIcon, Trash2Icon } from "lucide-react";
import React from "react";

import { useEditor, useTracks } from "../../core";
import { Button, Field, Panel, Textarea, TimeInput } from "../ui";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import styles from "./CueEditor.module.css";
import { QuickActions } from "./QuickActions.tsx";
import { TimeAdjustment } from "./TimeAdjustment.tsx";

interface SingleCueEditorProps {
  trackId: string;
  cueIndex: number;
}

export const SingleCueEditor: React.FC<SingleCueEditorProps> = ({
  trackId,
  cueIndex,
}) => {
  const editor = useEditor();
  const tracksModule = TrackModule.for(editor);
  const selectionModule = SelectionModule.for(editor);
  const history = HistoryModule.for(editor);

  const tracks = useTracks();
  const track = tracks.find((t) => t.id === trackId);
  const cue = useSignal(
    track!.document
      .getCuesSignal()
      .map((c) => c.find((c) => c.index === cueIndex)),
  );

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
  const charCount = cue.text.length;
  const lineCount = cue.text.split("\n").length;

  // Character per second (reading speed)
  const cps = duration > 0 ? (charCount / duration) * 1000 : 0;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    tracksModule.updateCue(trackId, cueIndex, { text: e.target.value });
  };

  const handleStartChange = (startMs: number) => {
    // Ensure start is before end
    if (startMs < cue.end.milliseconds) {
      tracksModule.updateCue(trackId, cueIndex, { startMs });
    }
  };

  const handleEndChange = (endMs: number) => {
    // Ensure end is after start
    if (endMs > cue.start.milliseconds) {
      tracksModule.updateCue(trackId, cueIndex, { endMs });
    }
  };

  const handleDeleteCue = () => {
    if (confirm("Are you sure you want to delete this cue?")) {
      tracksModule.deleteCue(trackId, cueIndex);
      selectionModule.clearCueSelection(trackId);
    }
  };

  const handleDuplicateCue = () => {
    tracksModule.insertCue(
      trackId,
      cue.end.milliseconds,
      cue.end.milliseconds + duration,
      cue.text,
      cueIndex,
    );
  };

  const handleShift = (deltaMs: number) => {
    const newStart = cue.start.milliseconds + deltaMs;
    const newEnd = cue.end.milliseconds + deltaMs;
    if (newStart >= 0 && newEnd > newStart) {
      tracksModule.updateCue(trackId, cueIndex, {
        startMs: newStart,
        endMs: newEnd,
      });
    }
  };

  return (
    <div className={styles.container}>
      <Panel.Header>
        <Panel.Title>
          <TextIcon size={16} />
          Edit Cue #{cueIndex}
        </Panel.Title>
      </Panel.Header>

      <div className={styles.content}>
        <div className={styles.section}>
          <QuickActions trackId={trackId} cue={cue} />
        </div>
        <div className={styles.section}>
          <Field
            label="Text Content"
            description={
              <div
                className={clsx({
                  [styles.charCountWarning]: cps > 20 || lineCount > 2,
                  [styles.charCountError]: cps > 25,
                })}
              >
                {charCount} chars • {lineCount} line{lineCount !== 1 ? "s" : ""}{" "}
                • {cps.toFixed(1)} chars/sec
              </div>
            }
          >
            <Textarea
              value={cue.text}
              onChange={handleTextChange}
              onFocus={() => history.startBatch("Edit Cue Text")}
              onBlur={() => history.endBatch()}
            />
          </Field>
        </div>
        <div className={clsx(styles.section, styles.row)}>
          <Field label="Start">
            <TimeInput
              value={cue.start.milliseconds}
              onChange={handleStartChange}
              onFocus={() => history.startBatch("Edit Cue Timing")}
              onBlur={() => history.endBatch()}
              max={cue.end.milliseconds - 1}
            />
          </Field>
          <Field label="End">
            <TimeInput
              value={cue.end.milliseconds}
              onChange={handleEndChange}
              onFocus={() => history.startBatch("Edit Cue Timing")}
              onBlur={() => history.endBatch()}
              min={cue.start.milliseconds + 1}
            />
          </Field>
        </div>
        <div className={clsx(styles.section, styles.timeAdjustment)}>
          <TimeAdjustment onShift={handleShift} />
        </div>
        <div className={clsx(styles.section, styles.actions)}>
          <Button variant="ghost" size="md" onClick={handleDuplicateCue}>
            <CopyIcon size={14} />
            Duplicate
          </Button>
          <Button variant="danger" size="md" onClick={handleDeleteCue}>
            <Trash2Icon size={14} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
