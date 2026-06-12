import {
  createEditorCue,
  deleteEditorCue,
  insertEditorCue,
  mergeEditorCues,
  replaceEditorCueRange,
  splitEditorCue,
  updateEditorCue,
  updateEditorCueTiming,
} from "../operations";
import { requirePayload } from "./helpers";
import {
  TIMED_TEXT_ACTION_CATEGORY,
  TIMED_TEXT_ACTION_SOURCE,
  TIMED_TEXT_CREATE_CUE_ACTION_ID,
  TIMED_TEXT_DELETE_CUE_ACTION_ID,
  TIMED_TEXT_INSERT_CUE_ACTION_ID,
  TIMED_TEXT_MERGE_CUES_ACTION_ID,
  TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID,
  TIMED_TEXT_SPLIT_CUE_ACTION_ID,
  TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID,
  TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID,
} from "./ids";
import type {
  CreateCueActionPayload,
  CreateCueActionResult,
  DeleteCueActionPayload,
  DeleteCueActionResult,
  InsertCueActionPayload,
  InsertCueActionResult,
  MergeCuesActionPayload,
  MergeCuesActionResult,
  ReplaceCueRangeActionPayload,
  ReplaceCueRangeActionResult,
  SplitCueActionPayload,
  SplitCueActionResult,
  TimedTextActionDefinition,
  UpdateCueTextActionPayload,
  UpdateCueTextActionResult,
  UpdateCueTimingActionPayload,
  UpdateCueTimingActionResult,
} from "./types";

export const createCueAction: TimedTextActionDefinition<
  CreateCueActionResult,
  CreateCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_CREATE_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Create cue",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_CREATE_CUE_ACTION_ID,
      invocation,
    );
    return createEditorCue(payload, context.createId);
  },
};

export const insertCueAction: TimedTextActionDefinition<
  InsertCueActionResult,
  InsertCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_INSERT_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Insert cue",
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_INSERT_CUE_ACTION_ID, invocation);
    return insertEditorCue(
      context.getDocument(),
      payload.trackId,
      payload.cue,
      payload.index,
    );
  },
};

export const deleteCueAction: TimedTextActionDefinition<
  DeleteCueActionResult,
  DeleteCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_DELETE_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Delete cue",
  keybindings: [{ keys: "Delete", preventDefault: true }],
  presentation: {
    contextMenu: { group: "Edit", order: 10 },
    menu: { path: ["Edit", "Delete cue"], order: 30 },
  },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_DELETE_CUE_ACTION_ID, invocation);
    return deleteEditorCue(context.getDocument(), payload.cueId);
  },
};

export const updateCueTextAction: TimedTextActionDefinition<
  UpdateCueTextActionResult,
  UpdateCueTextActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Update cue text",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID,
      invocation,
    );
    return updateEditorCue(context.getDocument(), payload.cueId, {
      text: payload.text,
    });
  },
};

export const updateCueTimingAction: TimedTextActionDefinition<
  UpdateCueTimingActionResult,
  UpdateCueTimingActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Update cue timing",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID,
      invocation,
    );
    return updateEditorCueTiming(
      context.getDocument(),
      payload.cueId,
      payload.startMs,
      payload.endMs,
    );
  },
};

export const replaceCueRangeAction: TimedTextActionDefinition<
  ReplaceCueRangeActionResult,
  ReplaceCueRangeActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Replace cue range",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID,
      invocation,
    );
    return replaceEditorCueRange(
      context.getDocument(),
      payload.trackId,
      payload.cueIds,
      payload.cues,
      payload.index,
    );
  },
};

export const splitCueAction: TimedTextActionDefinition<
  SplitCueActionResult,
  SplitCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SPLIT_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Split cue",
  keybindings: [{ keys: "Mod+Shift+S", preventDefault: true }],
  presentation: {
    contextMenu: { group: "Cue", order: 20 },
    menu: { path: ["Cue", "Split cue"], order: 20 },
  },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_SPLIT_CUE_ACTION_ID, invocation);
    return splitEditorCue(context.getDocument(), payload.cueId, payload.atMs, {
      createId: context.createId,
      firstText: payload.firstText,
      secondCueId: payload.secondCueId,
      secondText: payload.secondText,
      textDistribution: payload.textDistribution,
    });
  },
};

export const mergeCuesAction: TimedTextActionDefinition<
  MergeCuesActionResult,
  MergeCuesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_MERGE_CUES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Merge cues",
  keybindings: [{ keys: "Mod+M", preventDefault: true }],
  presentation: {
    contextMenu: { group: "Cue", order: 30 },
    menu: { path: ["Cue", "Merge cues"], order: 30 },
  },
  triggerFocus: {
    shortcut: "required",
    contextMenu: "required",
    menu: "none",
  },
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_MERGE_CUES_ACTION_ID, invocation);
    return mergeEditorCues(context.getDocument(), payload.cueIds, {
      separator: payload.separator,
      textCombination: payload.textCombination,
    });
  },
};

export const cueActions = {
  createCue: createCueAction,
  insertCue: insertCueAction,
  deleteCue: deleteCueAction,
  updateCueText: updateCueTextAction,
  updateCueTiming: updateCueTimingAction,
  replaceCueRange: replaceCueRangeAction,
  splitCue: splitCueAction,
  mergeCues: mergeCuesAction,
};

export const defaultCueActions: TimedTextActionDefinition[] = [
  createCueAction,
  insertCueAction,
  deleteCueAction,
  updateCueTextAction,
  updateCueTimingAction,
  replaceCueRangeAction,
  splitCueAction,
  mergeCuesAction,
];
