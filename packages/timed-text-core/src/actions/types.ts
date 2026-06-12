import type {
  ActionContext,
  ActionDefinition,
  ActionScope,
} from "@ptl/action-core";

import type {
  EditorTimedTextCue,
  EditorTimedTextDocument,
} from "../editor-model";
import type {
  AdjustGapMode,
  CreateEditorCueInput,
  DeleteEditorCueData,
  EditorOperationResult,
  FixOverlapMode,
  InsertEditorCueData,
  MergeEditorCuesData,
  MergeEditorCuesOptions,
  ReplaceEditorCueRangeData,
  SplitEditorCueData,
  SplitEditorCueOptions,
  UpdateEditorCueData,
} from "../operations";

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
