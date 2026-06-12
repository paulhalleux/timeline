import type { ActionDefinition } from "@ptl/action-core";

import {
  adjustEditorGaps,
  fixEditorOverlaps,
  scaleEditorCues,
  shiftEditorCues,
  snapEditorCuesToFrames,
  sortEditorCuesByTime,
} from "../operations";
import type { AdjustGapMode, FixOverlapMode } from "../operations";
import { documentActionResult, requirePayload } from "./helpers";
import {
  TIMED_TEXT_ACTION_CATEGORY,
  TIMED_TEXT_ACTION_SOURCE,
} from "./metadata";
import type { TimedTextActionContext } from "./context";

export interface ShiftCuesActionPayload {
  offsetMs: number;
  cueIds?: readonly string[];
}

export interface ScaleCuesActionPayload {
  factor: number;
  anchorMs?: number;
}

export interface SnapCuesToFramesActionPayload {
  frameRate: number;
}

export interface FixOverlapsActionPayload {
  mode?: FixOverlapMode;
  prioritizeIds?: readonly string[];
}

export interface AdjustGapsActionPayload {
  gapMs: number;
  mode?: AdjustGapMode;
}

export const shiftCuesAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof documentActionResult>,
  ShiftCuesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cues.shift",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Shift cues",
  presentation: { menu: { path: ["Timing", "Shift cues"], order: 10 } },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(shiftCuesAction, invocation);
    return documentActionResult(
      shiftEditorCues(context.getDocument(), payload.offsetMs, payload.cueIds),
    );
  },
};

export const scaleCuesAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof documentActionResult>,
  ScaleCuesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cues.scale",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Scale cues",
  presentation: { menu: { path: ["Timing", "Scale cues"], order: 20 } },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(scaleCuesAction, invocation);
    return documentActionResult(
      scaleEditorCues(context.getDocument(), payload.factor, payload.anchorMs),
    );
  },
};

export const snapCuesToFramesAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof documentActionResult>,
  SnapCuesToFramesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cues.snapToFrames",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Snap cues to frames",
  presentation: {
    menu: { path: ["Timing", "Snap cues to frames"], order: 30 },
  },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(snapCuesToFramesAction, invocation);
    return documentActionResult(
      snapEditorCuesToFrames(context.getDocument(), payload.frameRate),
    );
  },
};

export const fixOverlapsAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof documentActionResult>,
  FixOverlapsActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cues.fixOverlaps",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Fix overlaps",
  presentation: { menu: { path: ["Timing", "Fix overlaps"], order: 40 } },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(fixOverlapsAction, invocation);
    return documentActionResult(
      fixEditorOverlaps(
        context.getDocument(),
        payload.mode,
        payload.prioritizeIds,
      ),
    );
  },
};

export const adjustGapsAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof documentActionResult>,
  AdjustGapsActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cues.adjustGaps",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Adjust gaps",
  presentation: { menu: { path: ["Timing", "Adjust gaps"], order: 50 } },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(adjustGapsAction, invocation);
    return documentActionResult(
      adjustEditorGaps(context.getDocument(), payload.gapMs, payload.mode),
    );
  },
};

export const sortCuesByTimeAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof documentActionResult>,
  void
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cues.sortByTime",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Sort cues by time",
  presentation: {
    menu: { path: ["Timing", "Sort cues by time"], order: 60 },
  },
  triggerFocus: {
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

export const defaultTimingActions = Object.values(timingActions);
