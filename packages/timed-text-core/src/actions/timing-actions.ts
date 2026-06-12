import {
  adjustEditorGaps,
  fixEditorOverlaps,
  scaleEditorCues,
  shiftEditorCues,
  snapEditorCuesToFrames,
  sortEditorCuesByTime,
} from "../operations";
import { documentActionResult, requirePayload } from "./helpers";
import {
  TIMED_TEXT_ACTION_CATEGORY,
  TIMED_TEXT_ACTION_SOURCE,
  TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
  TIMED_TEXT_FIX_OVERLAPS_ACTION_ID,
  TIMED_TEXT_SCALE_CUES_ACTION_ID,
  TIMED_TEXT_SHIFT_CUES_ACTION_ID,
  TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
  TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID,
} from "./ids";
import type {
  AdjustGapsActionPayload,
  FixOverlapsActionPayload,
  ScaleCuesActionPayload,
  ShiftCuesActionPayload,
  SnapCuesToFramesActionPayload,
  TimedTextActionDefinition,
  TimedTextDocumentActionResult,
} from "./types";

export const shiftCuesAction: TimedTextActionDefinition<
  TimedTextDocumentActionResult,
  ShiftCuesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SHIFT_CUES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Shift cues",
  presentation: { menu: { path: ["Timing", "Shift cues"], order: 10 } },
  triggerScopes: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_SHIFT_CUES_ACTION_ID, invocation);
    return documentActionResult(
      shiftEditorCues(context.getDocument(), payload.offsetMs, payload.cueIds),
    );
  },
};

export const scaleCuesAction: TimedTextActionDefinition<
  TimedTextDocumentActionResult,
  ScaleCuesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SCALE_CUES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Scale cues",
  presentation: { menu: { path: ["Timing", "Scale cues"], order: 20 } },
  triggerScopes: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_SCALE_CUES_ACTION_ID, invocation);
    return documentActionResult(
      scaleEditorCues(context.getDocument(), payload.factor, payload.anchorMs),
    );
  },
};

export const snapCuesToFramesAction: TimedTextActionDefinition<
  TimedTextDocumentActionResult,
  SnapCuesToFramesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Snap cues to frames",
  presentation: {
    menu: { path: ["Timing", "Snap cues to frames"], order: 30 },
  },
  triggerScopes: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
      invocation,
    );
    return documentActionResult(
      snapEditorCuesToFrames(context.getDocument(), payload.frameRate),
    );
  },
};

export const fixOverlapsAction: TimedTextActionDefinition<
  TimedTextDocumentActionResult,
  FixOverlapsActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_FIX_OVERLAPS_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Fix overlaps",
  presentation: { menu: { path: ["Timing", "Fix overlaps"], order: 40 } },
  triggerScopes: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_FIX_OVERLAPS_ACTION_ID,
      invocation,
    );
    return documentActionResult(
      fixEditorOverlaps(
        context.getDocument(),
        payload.mode,
        payload.prioritizeIds,
      ),
    );
  },
};

export const adjustGapsAction: TimedTextActionDefinition<
  TimedTextDocumentActionResult,
  AdjustGapsActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Adjust gaps",
  presentation: { menu: { path: ["Timing", "Adjust gaps"], order: 50 } },
  triggerScopes: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
      invocation,
    );
    return documentActionResult(
      adjustEditorGaps(context.getDocument(), payload.gapMs, payload.mode),
    );
  },
};

export const sortCuesByTimeAction: TimedTextActionDefinition<
  TimedTextDocumentActionResult,
  void
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Sort cues by time",
  presentation: {
    menu: { path: ["Timing", "Sort cues by time"], order: 60 },
  },
  triggerScopes: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context) {
    return documentActionResult(sortEditorCuesByTime(context.getDocument()));
  },
};

export const timingActions = {
  shiftCues: shiftCuesAction,
  scaleCues: scaleCuesAction,
  snapCuesToFrames: snapCuesToFramesAction,
  fixOverlaps: fixOverlapsAction,
  adjustGaps: adjustGapsAction,
  sortCuesByTime: sortCuesByTimeAction,
};

export const defaultTimingActions: TimedTextActionDefinition[] = [
  shiftCuesAction,
  scaleCuesAction,
  snapCuesToFramesAction,
  fixOverlapsAction,
  adjustGapsAction,
  sortCuesByTimeAction,
];
