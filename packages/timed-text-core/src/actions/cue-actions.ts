import type { ActionDefinition } from "@ptl/action-core";

import type { EditorTimedTextCue } from "../editor-model";
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
import type {
  CreateEditorCueInput,
  MergeEditorCuesOptions,
  SplitEditorCueOptions,
} from "../operations";
import { requirePayload } from "./helpers";
import {
  TIMED_TEXT_ACTION_CATEGORY,
  TIMED_TEXT_ACTION_SOURCE,
} from "./metadata";
import type { TimedTextActionContext } from "./context";

export type CreateCueActionPayload = CreateEditorCueInput;

export interface InsertCueActionPayload {
  trackId: string;
  cue: EditorTimedTextCue;
  index?: number;
}

export interface DeleteCueActionPayload {
  cueId: string;
}

export interface UpdateCueTextActionPayload {
  cueId: string;
  text: string;
}

export interface UpdateCueTimingActionPayload {
  cueId: string;
  startMs: number;
  endMs: number;
}

export interface ReplaceCueRangeActionPayload {
  trackId: string;
  cueIds: readonly string[];
  cues: readonly EditorTimedTextCue[];
  index?: number;
}

export interface SplitCueActionPayload
  extends Omit<SplitEditorCueOptions, "createId"> {
  cueId: string;
  atMs: number;
}

export interface MergeCuesActionPayload extends MergeEditorCuesOptions {
  cueIds: readonly string[];
}

export const createCueAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof createEditorCue>,
  CreateCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.create",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Create cue",
  run(context, invocation) {
    const payload = requirePayload(createCueAction, invocation);
    return createEditorCue(payload, context.createId);
  },
};

export const insertCueAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof insertEditorCue>,
  InsertCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.insert",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Insert cue",
  run(context, invocation) {
    const payload = requirePayload(insertCueAction, invocation);
    return insertEditorCue(
      context.getDocument(),
      payload.trackId,
      payload.cue,
      payload.index,
    );
  },
};

export const deleteCueAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof deleteEditorCue>,
  DeleteCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.delete",
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
    const payload = requirePayload(deleteCueAction, invocation);
    return deleteEditorCue(context.getDocument(), payload.cueId);
  },
};

export const updateCueTextAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof updateEditorCue>,
  UpdateCueTextActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.updateText",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Update cue text",
  run(context, invocation) {
    const payload = requirePayload(updateCueTextAction, invocation);
    return updateEditorCue(context.getDocument(), payload.cueId, {
      text: payload.text,
    });
  },
};

export const updateCueTimingAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof updateEditorCueTiming>,
  UpdateCueTimingActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.updateTiming",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Update cue timing",
  run(context, invocation) {
    const payload = requirePayload(updateCueTimingAction, invocation);
    return updateEditorCueTiming(
      context.getDocument(),
      payload.cueId,
      payload.startMs,
      payload.endMs,
    );
  },
};

export const replaceCueRangeAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof replaceEditorCueRange>,
  ReplaceCueRangeActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.replaceRange",
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Replace cue range",
  run(context, invocation) {
    const payload = requirePayload(replaceCueRangeAction, invocation);
    return replaceEditorCueRange(
      context.getDocument(),
      payload.trackId,
      payload.cueIds,
      payload.cues,
      payload.index,
    );
  },
};

export const splitCueAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof splitEditorCue>,
  SplitCueActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.split",
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
    const payload = requirePayload(splitCueAction, invocation);
    return splitEditorCue(context.getDocument(), payload.cueId, payload.atMs, {
      createId: context.createId,
      firstText: payload.firstText,
      secondCueId: payload.secondCueId,
      secondText: payload.secondText,
      textDistribution: payload.textDistribution,
    });
  },
};

export const mergeCuesAction: ActionDefinition<
  TimedTextActionContext,
  ReturnType<typeof mergeEditorCues>,
  MergeCuesActionPayload
> = {
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: "timedText.cue.merge",
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
    const payload = requirePayload(mergeCuesAction, invocation);
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

export const defaultCueActions = Object.values(cueActions);
