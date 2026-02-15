import { type DragMode, DragModule } from "@ptl/subtitle-editor-core";
import type { SubtitleCue } from "@ptl/subtitle-kit";
import { useTimeline, ViewportItem } from "@ptl/timeline-react";
import * as React from "react";

import { type EntityId, useEditor, useIsCueDragging } from "../../core";
import styles from "./DraggableCue.module.css";

interface DraggableCueProps {
  trackId: EntityId;
  cue: SubtitleCue<any>;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export const DraggableCue: React.FC<DraggableCueProps> = ({
  trackId,
  cue,
  className,
  children,
  onClick,
}) => {
  const editor = useEditor();
  const timeline = useTimeline();
  const dragModule = DragModule.for(editor);

  // Subscribe only to whether THIS cue is dragging
  const isDragging = useIsCueDragging(trackId, cue.index);
  const shouldCancelClick = React.useRef(false);

  // Get display times - compute from drag module when dragging
  const getDisplayTimes = React.useCallback(() => {
    if (!isDragging) {
      return {
        start: cue.start.milliseconds,
        end: cue.end.milliseconds,
      };
    }

    const result = dragModule.computeResult();
    if (result) {
      return {
        start: result.newStart,
        end: result.newEnd,
      };
    }

    return {
      start: cue.start.milliseconds,
      end: cue.end.milliseconds,
    };
  }, [isDragging, cue.start.milliseconds, cue.end.milliseconds, dragModule]);

  const displayTimes = getDisplayTimes();

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, mode: DragMode) => {
      if (e.button !== 0) return; // Only left click
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      dragModule.startDrag(
        mode,
        { trackId, cueIndex: cue.index },
        cue.start.milliseconds,
        cue.end.milliseconds,
      );
    },
    [
      dragModule,
      trackId,
      cue.index,
      cue.start.milliseconds,
      cue.end.milliseconds,
    ],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      shouldCancelClick.current = true;

      const deltaPx = e.movementX;
      if (deltaPx === 0) return;

      dragModule.updateDelta(deltaPx, (px) => timeline.pxToUnit(px));
    },
    [isDragging, dragModule, timeline],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      e.currentTarget.releasePointerCapture(e.pointerId);
      e.stopPropagation();
      e.preventDefault();

      dragModule.endDrag();
    },
    [isDragging, dragModule],
  );

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (shouldCancelClick.current) {
        shouldCancelClick.current = false;
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      onClick?.(e);
    },
    [onClick],
  );

  return (
    <ViewportItem
      start={displayTimes.start}
      end={displayTimes.end}
      className={`${styles.cue} ${isDragging ? styles.dragging : ""} ${className ?? ""}`}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Left resize handle */}
      <div
        className={styles.resizeHandle}
        data-position="left"
        onPointerDown={(e) => handlePointerDown(e, "resize-start")}
      />

      {/* Main content area - for moving */}
      <div
        className={styles.content}
        onPointerDown={(e) => handlePointerDown(e, "move")}
      >
        {children}
      </div>

      {/* Right resize handle */}
      <div
        className={styles.resizeHandle}
        data-position="right"
        onPointerDown={(e) => handlePointerDown(e, "resize-end")}
      />
    </ViewportItem>
  );
};
