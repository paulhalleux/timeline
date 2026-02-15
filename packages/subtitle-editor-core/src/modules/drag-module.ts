import { type CoreApi, Store } from "@ptl/modular-core";

import type { SubtitleEditorApi } from "../editor";
import type { EditorModule } from "../editor-module";
import type { EntityId } from "../types";
import { SnappingModule } from "./snapping-module";
import { TrackModule } from "./track-module";

// ============================================================================
// Drag Module Types
// ============================================================================

export type DragMode = "move" | "resize-start" | "resize-end";

export interface DragTarget {
  trackId: EntityId;
  cueIndex: number;
}

export interface DragSession {
  /** The drag mode */
  mode: DragMode;
  /** Target being dragged */
  target: DragTarget;
  /** Original start time when drag began */
  initialStart: number;
  /** Original end time when drag began */
  initialEnd: number;
  /** Accumulated delta in ms (unsnapped) - tracks cursor position */
  deltaMs: number;
  /** Whether we've actually moved (to distinguish click from drag) */
  hasMoved: boolean;
}

export interface DragResult {
  /** The computed new start time */
  newStart: number;
  /** The computed new end time */
  newEnd: number;
  /** Whether snapping occurred */
  snapped: boolean;
  /** The snap position (if snapped) */
  snapPosition: number | null;
}

// ============================================================================
// Drag Module State
// ============================================================================

export interface DragModuleState {
  /** The current drag session, or null if not dragging */
  session: DragSession | null;
}

const createInitialState = (): DragModuleState => ({
  session: null,
});

// ============================================================================
// Drag Module API
// ============================================================================

export interface DragModuleApi {
  getStore(): Store<DragModuleState>;
  getState(): DragModuleState;

  /** Start a new drag session */
  startDrag(
    mode: DragMode,
    target: DragTarget,
    initialStart: number,
    initialEnd: number,
  ): void;

  /** Update the drag delta */
  updateDelta(deltaPx: number, pxToUnit: (px: number) => number): void;

  /** Compute the resulting times based on current drag state */
  computeResult(): DragResult | null;

  /** End the drag session and apply changes if moved */
  endDrag(): { applied: boolean; result: DragResult | null };

  /** Cancel the drag session without applying changes */
  cancelDrag(): void;

  /** Check if currently dragging */
  isDragging(): boolean;

  /** Get the current session */
  getSession(): DragSession | null;
}

// ============================================================================
// Drag Module
// ============================================================================

/**
 * Module for handling drag operations on cues.
 * Manages drag state and computes snapped positions.
 */
export class DragModule implements EditorModule<DragModuleApi> {
  static id = "DragModule";

  private readonly store: Store<DragModuleState>;
  private editor?: SubtitleEditorApi;

  constructor() {
    this.store = new Store<DragModuleState>(createInitialState());
  }

  // Static Methods

  static for<A>(editor: CoreApi<A>): DragModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(editor: SubtitleEditorApi): void {
    this.editor = editor;
  }

  detach(): void {
    this.editor = undefined;
  }

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<DragModuleState> {
    return this.store;
  }

  getState(): DragModuleState {
    return this.store.get();
  }

  // ---------------------------------------------------------------------------
  // Drag Operations
  // ---------------------------------------------------------------------------

  startDrag(
    mode: DragMode,
    target: DragTarget,
    initialStart: number,
    initialEnd: number,
  ): void {
    this.store.set({
      session: {
        mode,
        target,
        initialStart,
        initialEnd,
        deltaMs: 0,
        hasMoved: false,
      },
    });
  }

  updateDelta(deltaPx: number, pxToUnit: (px: number) => number): void {
    const session = this.getState().session;
    if (!session || deltaPx === 0) return;

    const deltaUnits = pxToUnit(deltaPx);

    this.store.set({
      session: {
        ...session,
        deltaMs: session.deltaMs + deltaUnits,
        hasMoved: true,
      },
    });

    // Update snap indicator
    this.updateSnapIndicator();
  }

  computeResult(): DragResult | null {
    if (!this.editor) return null;

    const session = this.getState().session;
    if (!session) return null;

    const { mode, target, initialStart, initialEnd, deltaMs } = session;
    const duration = initialEnd - initialStart;

    const snappingModule = SnappingModule.for(this.editor);

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
        target.trackId,
        target.cueIndex,
      );
      // Try snapping end position
      const endSnapResult = snappingModule.snap(
        newEnd,
        target.trackId,
        target.cueIndex,
      );

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
      const snapResult = snappingModule.snap(
        newStart,
        target.trackId,
        target.cueIndex,
      );
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
      const snapResult = snappingModule.snap(
        newEnd,
        target.trackId,
        target.cueIndex,
      );
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
  }

  private updateSnapIndicator(): void {
    if (!this.editor) return;

    const session = this.getState().session;
    const snappingModule = SnappingModule.for(this.editor);

    if (!session || !session.hasMoved) {
      snappingModule.clearActiveSnapTarget();
      return;
    }

    const result = this.computeResult();
    if (result && result.snapped && result.snapPosition !== null) {
      snappingModule.setActiveSnapTarget(result.snapPosition);
    } else {
      snappingModule.clearActiveSnapTarget();
    }
  }

  endDrag(): { applied: boolean; result: DragResult | null } {
    if (!this.editor) {
      this.store.set({ session: null });
      return { applied: false, result: null };
    }

    const session = this.getState().session;
    if (!session) {
      return { applied: false, result: null };
    }

    const snappingModule = SnappingModule.for(this.editor);
    snappingModule.clearActiveSnapTarget();

    if (!session.hasMoved) {
      this.store.set({ session: null });
      return { applied: false, result: null };
    }

    const result = this.computeResult();
    if (!result) {
      this.store.set({ session: null });
      return { applied: false, result: null };
    }

    const { newStart, newEnd } = result;
    const { target, initialStart, initialEnd } = session;

    // Apply the changes if there are any
    if (newStart !== initialStart || newEnd !== initialEnd) {
      const trackModule = TrackModule.for(this.editor);
      trackModule.updateCue(target.trackId, target.cueIndex, {
        startMs: Math.round(newStart),
        endMs: Math.round(newEnd),
      });
    }

    this.store.set({ session: null });
    return { applied: true, result };
  }

  cancelDrag(): void {
    if (this.editor) {
      const snappingModule = SnappingModule.for(this.editor);
      snappingModule.clearActiveSnapTarget();
    }
    this.store.set({ session: null });
  }

  isDragging(): boolean {
    return this.getState().session !== null;
  }

  getSession(): DragSession | null {
    return this.getState().session;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    this.editor = undefined;
  }
}
