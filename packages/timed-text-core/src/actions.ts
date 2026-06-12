import {
  createActionScope,
  type ActionContext,
  type ActionDefinition,
  type ActionGuardResult,
  type ActionInvocation,
  type ActionScope,
} from "@ptl/action-core";

import type {
  EditorTimedTextCue,
  EditorTimedTextDocument,
} from "./editor-model";
import {
  adjustEditorGaps,
  createEditorCue,
  deleteEditorCue,
  fixEditorOverlaps,
  insertEditorCue,
  mergeEditorCues,
  operationSuccess,
  replaceEditorCueRange,
  scaleEditorCues,
  shiftEditorCues,
  snapEditorCuesToFrames,
  sortEditorCuesByTime,
  splitEditorCue,
  updateEditorCue,
  updateEditorCueTiming,
  type AdjustGapMode,
  type CreateEditorCueInput,
  type DeleteEditorCueData,
  type EditorOperationResult,
  type FixOverlapMode,
  type InsertEditorCueData,
  type MergeEditorCuesData,
  type MergeEditorCuesOptions,
  type ReplaceEditorCueRangeData,
  type SplitEditorCueData,
  type SplitEditorCueOptions,
  type UpdateEditorCueData,
} from "./operations";

export const TIMED_TEXT_ACTION_SCOPE_ID = "timedText";

export const TIMED_TEXT_CREATE_CUE_ACTION_ID = "timedText.cue.create";
export const TIMED_TEXT_INSERT_CUE_ACTION_ID = "timedText.cue.insert";
export const TIMED_TEXT_DELETE_CUE_ACTION_ID = "timedText.cue.delete";
export const TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID = "timedText.cue.updateText";
export const TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID =
  "timedText.cue.updateTiming";
export const TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID =
  "timedText.cue.replaceRange";
export const TIMED_TEXT_SPLIT_CUE_ACTION_ID = "timedText.cue.split";
export const TIMED_TEXT_MERGE_CUES_ACTION_ID = "timedText.cue.merge";
export const TIMED_TEXT_SHIFT_CUES_ACTION_ID = "timedText.cues.shift";
export const TIMED_TEXT_SCALE_CUES_ACTION_ID = "timedText.cues.scale";
export const TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID =
  "timedText.cues.snapToFrames";
export const TIMED_TEXT_FIX_OVERLAPS_ACTION_ID = "timedText.cues.fixOverlaps";
export const TIMED_TEXT_ADJUST_GAPS_ACTION_ID = "timedText.cues.adjustGaps";
export const TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID =
  "timedText.cues.sortByTime";

export const TIMED_TEXT_ACTION_IDS = {
  createCue: TIMED_TEXT_CREATE_CUE_ACTION_ID,
  insertCue: TIMED_TEXT_INSERT_CUE_ACTION_ID,
  deleteCue: TIMED_TEXT_DELETE_CUE_ACTION_ID,
  updateCueText: TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID,
  updateCueTiming: TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID,
  replaceCueRange: TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID,
  splitCue: TIMED_TEXT_SPLIT_CUE_ACTION_ID,
  mergeCues: TIMED_TEXT_MERGE_CUES_ACTION_ID,
  shiftCues: TIMED_TEXT_SHIFT_CUES_ACTION_ID,
  scaleCues: TIMED_TEXT_SCALE_CUES_ACTION_ID,
  snapCuesToFrames: TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
  fixOverlaps: TIMED_TEXT_FIX_OVERLAPS_ACTION_ID,
  adjustGaps: TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
  sortCuesByTime: TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID,
};

const TIMED_TEXT_ACTION_CATEGORY = "Timed Text";
const TIMED_TEXT_ACTION_SOURCE = "@ptl/timed-text-core";

/**
 * Optional selection service commonly used by cue-oriented timed-text actions.
 */
export interface TimedTextActionSelectionService {
  getCueIds(): readonly string[];
  getTrackId?(): string | undefined;
}

/**
 * Context required by built-in timed-text actions.
 *
 * Timed-text actions are regular @ptl/action-core actions with a domain-specific
 * context. They return pure operation results; the host decides whether to keep
 * those results in local state, history, collaboration, or persistence layers.
 */
export interface TimedTextActionContext extends ActionContext {
  getDocument(): EditorTimedTextDocument;
  selection?: TimedTextActionSelectionService;
  createId?: (prefix: string) => string;
}

/**
 * Action definition type used by timed-text-core.
 */
export type TimedTextActionDefinition<
  TResult = unknown,
  TPayload = unknown,
> = ActionDefinition<TimedTextActionContext, TResult, TPayload>;

export type TimedTextActionScope = ActionScope<TimedTextActionContext>;

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

export type CreateCueActionResult = EditorTimedTextCue;
export type InsertCueActionResult = EditorOperationResult<InsertEditorCueData>;
export type DeleteCueActionResult = EditorOperationResult<DeleteEditorCueData>;
export type UpdateCueTextActionResult =
  EditorOperationResult<UpdateEditorCueData>;
export type UpdateCueTimingActionResult =
  EditorOperationResult<UpdateEditorCueData>;
export type ReplaceCueRangeActionResult =
  EditorOperationResult<ReplaceEditorCueRangeData>;
export type SplitCueActionResult = EditorOperationResult<SplitEditorCueData>;
export type MergeCuesActionResult = EditorOperationResult<MergeEditorCuesData>;
export type TimedTextDocumentActionResult = EditorOperationResult<undefined>;

export function createTimedTextActionScope(options: {
  getContext: () => TimedTextActionContext;
  actions?: Iterable<TimedTextActionDefinition>;
  id?: string;
}): TimedTextActionScope {
  return createActionScope({
    id: options.id ?? TIMED_TEXT_ACTION_SCOPE_ID,
    getContext: options.getContext,
    actions: options.actions ?? defaultTimedTextActions,
  });
}

function timedTextAction<TResult, TPayload>(
  action: TimedTextActionDefinition<TResult, TPayload>,
): TimedTextActionDefinition<TResult, TPayload> {
  return action;
}

function documentActionResult(
  document: EditorTimedTextDocument,
): TimedTextDocumentActionResult {
  return operationSuccess(document, undefined);
}

function requirePayload<TPayload>(
  actionId: string,
  invocation: ActionInvocation<TPayload>,
): TPayload {
  if (invocation.payload === undefined) {
    throw new Error(`Action "${actionId}" requires a payload.`);
  }

  return invocation.payload;
}

const createCueAction = timedTextAction<
  CreateCueActionResult,
  CreateCueActionPayload
>({
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
});

const insertCueAction = timedTextAction<
  InsertCueActionResult,
  InsertCueActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_INSERT_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Insert cue",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_INSERT_CUE_ACTION_ID,
      invocation,
    );
    return insertEditorCue(
      context.getDocument(),
      payload.trackId,
      payload.cue,
      payload.index,
    );
  },
});

const deleteCueAction = timedTextAction<
  DeleteCueActionResult,
  DeleteCueActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_DELETE_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Delete cue",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_DELETE_CUE_ACTION_ID,
      invocation,
    );
    return deleteEditorCue(context.getDocument(), payload.cueId);
  },
});

const updateCueTextAction = timedTextAction<
  UpdateCueTextActionResult,
  UpdateCueTextActionPayload
>({
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
});

const updateCueTimingAction = timedTextAction<
  UpdateCueTimingActionResult,
  UpdateCueTimingActionPayload
>({
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
});

const replaceCueRangeAction = timedTextAction<
  ReplaceCueRangeActionResult,
  ReplaceCueRangeActionPayload
>({
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
});

const splitCueAction = timedTextAction<
  SplitCueActionResult,
  SplitCueActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SPLIT_CUE_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Split cue",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_SPLIT_CUE_ACTION_ID,
      invocation,
    );
    return splitEditorCue(context.getDocument(), payload.cueId, payload.atMs, {
      createId: context.createId,
      firstText: payload.firstText,
      secondCueId: payload.secondCueId,
      secondText: payload.secondText,
      textDistribution: payload.textDistribution,
    });
  },
});

const mergeCuesAction = timedTextAction<
  MergeCuesActionResult,
  MergeCuesActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_MERGE_CUES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Merge cues",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_MERGE_CUES_ACTION_ID,
      invocation,
    );
    return mergeEditorCues(context.getDocument(), payload.cueIds, {
      separator: payload.separator,
      textCombination: payload.textCombination,
    });
  },
});

const shiftCuesAction = timedTextAction<
  TimedTextDocumentActionResult,
  ShiftCuesActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SHIFT_CUES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Shift cues",
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_SHIFT_CUES_ACTION_ID, invocation);
    return documentActionResult(
      shiftEditorCues(context.getDocument(), payload.offsetMs, payload.cueIds),
    );
  },
});

const scaleCuesAction = timedTextAction<
  TimedTextDocumentActionResult,
  ScaleCuesActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SCALE_CUES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Scale cues",
  run(context, invocation) {
    const payload = requirePayload(TIMED_TEXT_SCALE_CUES_ACTION_ID, invocation);
    return documentActionResult(
      scaleEditorCues(context.getDocument(), payload.factor, payload.anchorMs),
    );
  },
});

const snapCuesToFramesAction = timedTextAction<
  TimedTextDocumentActionResult,
  SnapCuesToFramesActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Snap cues to frames",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
      invocation,
    );
    return documentActionResult(
      snapEditorCuesToFrames(context.getDocument(), payload.frameRate),
    );
  },
});

const fixOverlapsAction = timedTextAction<
  TimedTextDocumentActionResult,
  FixOverlapsActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_FIX_OVERLAPS_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Fix overlaps",
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
});

const adjustGapsAction = timedTextAction<
  TimedTextDocumentActionResult,
  AdjustGapsActionPayload
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Adjust gaps",
  run(context, invocation) {
    const payload = requirePayload(
      TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
      invocation,
    );
    return documentActionResult(
      adjustEditorGaps(context.getDocument(), payload.gapMs, payload.mode),
    );
  },
});

const sortCuesByTimeAction = timedTextAction<
  TimedTextDocumentActionResult,
  void
>({
  category: TIMED_TEXT_ACTION_CATEGORY,
  id: TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID,
  source: TIMED_TEXT_ACTION_SOURCE,
  title: "Sort cues by time",
  run(context) {
    return documentActionResult(sortEditorCuesByTime(context.getDocument()));
  },
});

export const timedTextActions = {
  createCue: createCueAction,
  insertCue: insertCueAction,
  deleteCue: deleteCueAction,
  updateCueText: updateCueTextAction,
  updateCueTiming: updateCueTimingAction,
  replaceCueRange: replaceCueRangeAction,
  splitCue: splitCueAction,
  mergeCues: mergeCuesAction,
  shiftCues: shiftCuesAction,
  scaleCues: scaleCuesAction,
  snapCuesToFrames: snapCuesToFramesAction,
  fixOverlaps: fixOverlapsAction,
  adjustGaps: adjustGapsAction,
  sortCuesByTime: sortCuesByTimeAction,
};

export const defaultTimedTextActions: TimedTextActionDefinition[] = [
  createCueAction,
  insertCueAction,
  deleteCueAction,
  updateCueTextAction,
  updateCueTimingAction,
  replaceCueRangeAction,
  splitCueAction,
  mergeCuesAction,
  shiftCuesAction,
  scaleCuesAction,
  snapCuesToFramesAction,
  fixOverlapsAction,
  adjustGapsAction,
  sortCuesByTimeAction,
];

/**
 * Helper for actions that need one or more selected cues.
 */
export function hasSelectedCues(
  context: TimedTextActionContext,
): boolean | ActionGuardResult {
  const selectedCueIds = context.selection?.getCueIds() ?? [];
  if (selectedCueIds.length > 0) return true;
  return { ok: false, reason: "No cue is selected." };
}

/**
 * Helper for actions that need exactly one selected cue.
 */
export function hasSingleSelectedCue(
  context: TimedTextActionContext,
): boolean | ActionGuardResult {
  const selectedCueIds = context.selection?.getCueIds() ?? [];
  if (selectedCueIds.length === 1) return true;
  return { ok: false, reason: "Exactly one cue must be selected." };
}
