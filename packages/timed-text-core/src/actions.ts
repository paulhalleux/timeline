import {
  createActionScope,
  type ActionContext,
  type ActionDefinition,
  type ActionGuardResult,
  type ActionInvocation,
  type ActionKeyBinding,
  type ActionPresentation,
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

export interface TimedTextActionOptions<TResult, TPayload> {
  id: string;
  title: string;
  category?: string;
  description?: string;
  source?: string;
  order?: number;
  keybindings?: readonly ActionKeyBinding[];
  presentation?: ActionPresentation;
  visibleWhen?: (
    context: TimedTextActionContext,
  ) => boolean | ActionGuardResult;
  enabledWhen?: (
    context: TimedTextActionContext,
  ) => boolean | ActionGuardResult;
  run(
    context: TimedTextActionContext,
    invocation: ActionInvocation<TPayload>,
  ): TResult | Promise<TResult>;
}

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

/**
 * Define a timed-text action with the default timed-text category and source.
 */
export function defineTimedTextAction<TResult = unknown, TPayload = unknown>(
  options: TimedTextActionOptions<TResult, TPayload>,
): TimedTextActionDefinition<TResult, TPayload> {
  return {
    id: options.id,
    title: options.title,
    category: options.category ?? "Timed Text",
    description: options.description,
    source: options.source ?? "@ptl/timed-text-core",
    order: options.order,
    keybindings: options.keybindings,
    presentation: options.presentation,
    visibleWhen: options.visibleWhen,
    enabledWhen: options.enabledWhen,
    run: options.run,
  };
}

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
  insertCue: defineTimedTextAction<InsertCueActionResult, InsertCueActionPayload>(
    {
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
    },
  ),

  deleteCue: defineTimedTextAction<DeleteCueActionResult, DeleteCueActionPayload>(
    {
      id: TIMED_TEXT_ACTION_IDS.deleteCue,
      title: "Delete cue",
      run(context, invocation) {
        const payload = requirePayload(
          TIMED_TEXT_ACTION_IDS.deleteCue,
          invocation,
        );
        return deleteEditorCue(context.getDocument(), payload.cueId);
      },
    },
  ),

  updateCueText: defineTimedTextAction<
    UpdateCueTextActionResult,
    UpdateCueTextActionPayload
  >({
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
  }),

  updateCueTiming: defineTimedTextAction<
    UpdateCueTimingActionResult,
    UpdateCueTimingActionPayload
  >({
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
  }),

  splitCue: defineTimedTextAction<SplitCueActionResult, SplitCueActionPayload>({
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
  }),

  mergeCues: defineTimedTextAction<MergeCuesActionResult, MergeCuesActionPayload>(
    {
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
    },
  ),
} satisfies Record<string, TimedTextActionDefinition>;

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
