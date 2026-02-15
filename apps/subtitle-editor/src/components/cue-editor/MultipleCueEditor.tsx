import {
  HistoryModule,
  SelectionModule,
  TrackModule,
} from "@ptl/subtitle-editor-core";
import { clsx } from "clsx";
import { LayersIcon, Trash2Icon } from "lucide-react";
import React from "react";

import { useEditor, useTracks } from "../../core";
import { Button, Panel } from "../ui";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import styles from "./CueEditor.module.css";
import { TimeAdjustment } from "./TimeAdjustment.tsx";

interface MultipleCueEditorProps {
  trackId: string;
  cueIndices: number[];
}

export const MultipleCueEditor: React.FC<MultipleCueEditorProps> = ({
  trackId,
  cueIndices,
}) => {
  const editor = useEditor();
  const tracksModule = TrackModule.for(editor);
  const selectionModule = SelectionModule.for(editor);
  const tracks = useTracks();
  const track = tracks.find((t) => t.id === trackId);

  if (!track) return null;

  const handleDeleteAll = () => {
    if (confirm(`Delete ${cueIndices.length} selected cues?`)) {
      // Delete in reverse order to maintain indices
      const sorted = [...cueIndices].sort((a, b) => b - a);
      sorted.forEach((index) => {
        tracksModule.deleteCue(trackId, index);
      });
      selectionModule.clearCueSelection(trackId);
    }
  };

  const handleShiftTiming = (offsetMs: number) => {
    const history = HistoryModule.for(editor);
    history.batch("Shift Multiple Cues", () => {
      cueIndices.forEach((index) => {
        const cue = track.document.getCues().find((c) => c.index === index);
        if (cue) {
          tracksModule.updateCue(trackId, index, {
            startMs: Math.max(0, cue.start.milliseconds + offsetMs),
            endMs: cue.end.milliseconds + offsetMs,
          });
        }
      });
    });
  };

  return (
    <div className={styles.container}>
      <Panel.Header>
        <Panel.Title>
          <LayersIcon size={16} />
          <span>Multiple Cues</span>
        </Panel.Title>
      </Panel.Header>

      <div className={styles.content}>
        <div className={styles.section}>
          <EmptyState
            icon={<LayersIcon size={48} />}
            title={`${cueIndices.length} Cues Selected`}
            description="Edit multiple cues at once"
          />
        </div>
        <div className={styles.section}>
          <TimeAdjustment onShift={handleShiftTiming} />
        </div>
        <div className={clsx(styles.actions, styles.section)}>
          <Button variant="danger" size="md" onClick={handleDeleteAll}>
            <Trash2Icon size={14} />
            Delete All ({cueIndices.length})
          </Button>
        </div>
      </div>
    </div>
  );
};
