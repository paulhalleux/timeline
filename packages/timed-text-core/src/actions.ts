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
  deleteEditorCue,
  insertEditorCue,
  mergeEditorCues,
  splitEditorCue,
  updateEditorCue,
  updateEditorCueTiming,
  type DeleteEditorCueData,
  type EditorOperationResult,
  type InsertEditorCueData,
  type MergeEditorCuesData,
  type MergeEditorCuesOptions,
  type SplitEditorCueData,
  type SplitEditorCueOptions,
  type UpdateEditorCueData,
} from "./operations";

export const TIMED_TEXT_ACTION_SCOPE_ID = "timedText";

export const TIMED_TEXT_ACTION_IDS = {
  insertCue: "timedText.cue.insert",
  deleteCue: "timedText.cue.delete",
  updateCueText: "timedText.cue.updateText",
  updateCueTiming: "timedText.cue.updateTiming",
  splitCue: "timedText.cue.split",
  mergeCues: "timedText.cue.merge",
} as const;

const TIMED_TEXT_ACTION_DEFAULTS = {
  category: "Timed Text",
  source: "@ptl/timed-text-core",
} as const;

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

export interface SplitCueActionPayload
  extends Omit<SplitEditorCueOptions, "createId"> {
  cueId: string;
  atMs: number;
}

export interface MergeCuesActionPayload extends MergeEditorCuesOptions {
  cueIds: readonly string[];
}

export type InsertCueActionResult = EditorOperationResult<InsertEditorCueData>;
export type DeleteCueActionResult = EditorOperationResult<DeleteEditorCueData>;
export type UpdateCueTextActionResult =
  EditorOperationResult<UpdateEditorCueData>;
export type UpdateCueTimingActionResult =
  EditorOperationResult<UpdateEditorCueData>;
export type SplitCueActionResult = EditorOperationResult<SplitEditorCueData>;
export type MergeCuesActionResult = EditorOperationResult<MergeEditorCuesData>;

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

function requirePayload<TPayload>(
  actionId: string,
  invocation: ActionInvocation<TPayload>,
): TPayload {
  if (invocation.payload === undefined) {
    throw new Error(`Action "${actionId}" requires a payload.`);
  }

  return invocation.payload;
}

export const timedTextActions = {
  insertCue: {
    ...TIMED_TEXT_ACTION_DEFAULTS,
    id: TIMED_TEXT_ACTION_IDS.insertCue,
    title: "Insert cue",
    run(context, invocation) {
      const payload = requirePayload(
        TIMED_TEXT_ACTION_IDS.insertCue,
        invocation,
      );
      return insertEditorCue(
        context.getDocument(),
        payload.trackId,
        payload.cue,
        payload.index,
      );
    },
  } satisfies TimedTextActionDefinition<
    InsertCueActionResult,
    InsertCueActionPayload
  >,

  deleteCue: {
    ...TIMED_TEXT_ACTION_DEFAULTS,
    id: TIMED_TEXT_ACTION_IDS.deleteCue,
    title: "Delete cue",
    run(context, invocation) {
      const payload = requirePayload(
        TIMED_TEXT_ACTION_IDS.deleteCue,
        invocation,
      );
      return deleteEditorCue(context.getDocument(), payload.cueId);
    },
  } satisfies TimedTextActionDefinition<
    DeleteCueActionResult,
    DeleteCueActionPayload
  >,

  updateCueText: {
    ...TIMED_TEXT_ACTION_DEFAULTS,
    id: TIMED_TEXT_ACTION_IDS.updateCueText,
    title: "Update cue text",
    run(context, invocation) {
      const payload = requirePayload(
        TIMED_TEXT_ACTION_IDS.updateCueText,
        invocation,
      );
      return updateEditorCue(context.getDocument(), payload.cueId, {
        text: payload.text,
      });
    },
  } satisfies TimedTextActionDefinition<
    UpdateCueTextActionResult,
    UpdateCueTextActionPayload
  >,

  updateCueTiming: {
    ...TIMED_TEXT_ACTION_DEFAULTS,
    id: TIMED_TEXT_ACTION_IDS.updateCueTiming,
    title: "Update cue timing",
    run(context, invocation) {
      const payload = requirePayload(
        TIMED_TEXT_ACTION_IDS.updateCueTiming,
        invocation,
      );
      return updateEditorCueTiming(
        context.getDocument(),
        payload.cueId,
        payload.startMs,
        payload.endMs,
      );
    },
  } satisfies TimedTextActionDefinition<
    UpdateCueTimingActionResult,
    UpdateCueTimingActionPayload
  >,

  splitCue: {
    ...TIMED_TEXT_ACTION_DEFAULTS,
    id: TIMED_TEXT_ACTION_IDS.splitCue,
    title: "Split cue",
    run(context, invocation) {
      const payload = requirePayload(
        TIMED_TEXT_ACTION_IDS.splitCue,
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
  } satisfies TimedTextActionDefinition<
    SplitCueActionResult,
    SplitCueActionPayload
  >,

  mergeCues: {
    ...TIMED_TEXT_ACTION_DEFAULTS,
    id: TIMED_TEXT_ACTION_IDS.mergeCues,
    title: "Merge cues",
    run(context, invocation) {
      const payload = requirePayload(
        TIMED_TEXT_ACTION_IDS.mergeCues,
        invocation,
      );
      return mergeEditorCues(context.getDocument(), payload.cueIds, {
        separator: payload.separator,
        textCombination: payload.textCombination,
      });
    },
  } satisfies TimedTextActionDefinition<
    MergeCuesActionResult,
    MergeCuesActionPayload
  >,
};

export const defaultTimedTextActions = Object.values(timedTextActions);

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
