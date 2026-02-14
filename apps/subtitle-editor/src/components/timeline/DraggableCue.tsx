import { SnappingModule, TrackModule } from "@ptl/subtitle-editor-core";
import type { SubtitleCue } from "@ptl/subtitle-kit";
import { useTimeline, ViewportItem } from "@ptl/timeline-react";
import * as React from "react";

import { type EntityId, useEditor } from "../../core";
import styles from "./DraggableCue.module.css";

type DragMode = "move" | "resize-start" | "resize-end" | null;

interface DragState {
  mode: DragMode;
  /** Original start time when drag began */
  initialStart: number;
  /** Original end time when drag began */
  initialEnd: number;
  /** Accumulated delta in ms (unsnapped) - tracks cursor position */
  deltaMs: number;
  /** Whether we've actually moved (to distinguish click from drag) */
  hasMoved: boolean;
}

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
  const snappingModule = SnappingModule.for(editor);
  const trackModule = TrackModule.for(editor);

  const [dragState, setDragState] = React.useState<DragState | null>(null);

  const startMs = cue.start.milliseconds;
  const endMs = cue.end.milliseconds;

  // Compute the new start/end times based on drag state
  const computeNewTimes = React.useCallback(
    (
      state: DragState,
    ): {
      newStart: number;
      newEnd: number;
      snapped: boolean;
      snapPosition: number | null;
    } => {
      const { mode, initialStart, initialEnd, deltaMs } = state;
      const duration = initialEnd - initialStart;

      let newStart = initialStart;
      let newEnd = initialEnd;
      let snapped = false;
      let snapPosition: number | null = null;

      if (mode === "move") {
        // Move both start and end
        newStart = initialStart + deltaMs;
        newEnd = initialEnd + deltaMs;

        // Try snapping start position
        const startSnapResult = snappingModule.snap(
          newStart,
          trackId,
          cue.index,
        );
        // Try snapping end position
        const endSnapResult = snappingModule.snap(newEnd, trackId, cue.index);

        // Determine which snap is closer (if both are valid)
        const startDistance =
          startSnapResult.snapped && startSnapResult.target !== null
            ? Math.abs(newStart - startSnapResult.target)
            : Infinity;
        const endDistance =
          endSnapResult.snapped && endSnapResult.target !== null
            ? Math.abs(newEnd - endSnapResult.target)
            : Infinity;

        if (
          startDistance <= endDistance &&
          startSnapResult.snapped &&
          startSnapResult.target !== null
        ) {
          // Snap start - move the whole cue
          newStart = startSnapResult.target;
          newEnd = newStart + duration;
          snapped = true;
          snapPosition = newStart;
        } else if (endSnapResult.snapped && endSnapResult.target !== null) {
          // Snap end - move the whole cue so end aligns
          newEnd = endSnapResult.target;
          newStart = newEnd - duration;
          snapped = true;
          snapPosition = newEnd;
        }
      } else if (mode === "resize-start") {
        newStart = initialStart + deltaMs;

        // Snap the start position
        const snapResult = snappingModule.snap(newStart, trackId, cue.index);
        if (snapResult.snapped && snapResult.target !== null) {
          newStart = snapResult.target;
          snapped = true;
          snapPosition = newStart;
        }

        // Ensure minimum duration (100ms)
        if (newStart >= newEnd - 100) {
          newStart = newEnd - 100;
        }
      } else if (mode === "resize-end") {
        newEnd = initialEnd + deltaMs;

        // Snap the end position
        const snapResult = snappingModule.snap(newEnd, trackId, cue.index);
        if (snapResult.snapped && snapResult.target !== null) {
          newEnd = snapResult.target;
          snapped = true;
          snapPosition = newEnd;
        }

        // Ensure minimum duration (100ms)
        if (newEnd <= newStart + 100) {
          newEnd = newStart + 100;
        }
      }

      // Prevent going negative
      if (newStart < 0) {
        if (mode === "move") {
          newEnd = newEnd - newStart;
        }
        newStart = 0;
      }

      return { newStart, newEnd, snapped, snapPosition };
    },
    [snappingModule, trackId, cue.index],
  );

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragState({
        mode,
        initialStart: startMs,
        initialEnd: endMs,
        deltaMs: 0,
        hasMoved: false,
      });
    },
    [startMs, endMs],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState) return;

      const deltaPx = e.movementX;
      if (deltaPx === 0) return;

      const deltaUnits = timeline.pxToUnit(deltaPx);

      setDragState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          deltaMs: prev.deltaMs + deltaUnits,
          hasMoved: true,
        };
      });
    },
    [dragState, timeline],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState) return;

      e.currentTarget.releasePointerCapture(e.pointerId);
      e.stopPropagation();
      e.preventDefault();

      // Only apply changes if we actually moved
      if (dragState.hasMoved) {
        const { newStart, newEnd } = computeNewTimes(dragState);

        if (newStart !== startMs || newEnd !== endMs) {
          trackModule.updateCue(trackId, cue.index, {
            startMs: Math.round(newStart),
            endMs: Math.round(newEnd),
          });
        }
      }

      snappingModule.clearActiveSnapTarget();
      setDragState(null);
    },
    [
      dragState,
      startMs,
      endMs,
      trackModule,
      trackId,
      cue.index,
      snappingModule,
      computeNewTimes,
    ],
  );

  // Update snap indicator when drag state changes
  React.useEffect(() => {
    if (dragState && dragState.hasMoved) {
      const { snapped, snapPosition } = computeNewTimes(dragState);

      if (snapped && snapPosition !== null) {
        snappingModule.setActiveSnapTarget(snapPosition);
      } else {
        snappingModule.clearActiveSnapTarget();
      }
    }
  }, [dragState, computeNewTimes, snappingModule]);

  // Calculate display times
  let displayStart = startMs;
  let displayEnd = endMs;

  if (dragState && dragState.hasMoved) {
    const computed = computeNewTimes(dragState);
    displayStart = computed.newStart;
    displayEnd = computed.newEnd;
  }

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      // Only fire click if we didn't drag
      if (dragState?.hasMoved) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      onClick?.(e);
    },
    [onClick, dragState],
  );

  return (
    <ViewportItem
      start={displayStart}
      end={displayEnd}
      className={`${styles.cue} ${dragState ? styles.dragging : ""} ${className ?? ""}`}
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
