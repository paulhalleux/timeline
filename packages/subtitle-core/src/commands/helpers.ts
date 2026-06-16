import {
  operationSuccess,
  type EditorOperationResult,
  type EditorTimedTextDocument,
} from "@ptl/timed-text-core";
import { getSelectedCueIds } from "../selection";
import type { TimedTextCommandContext } from "./context";

export function documentCommandResult(document: EditorTimedTextDocument) {
  return operationSuccess(document, undefined);
}

export function requireCommandInput<TInput>(commandId: string, input: TInput | undefined): TInput {
  if (input === undefined) {
    throw new Error(`Command "${commandId}" requires input.`);
  }

  return input;
}

export function commitTimedTextCommandResult<TData>(
  context: TimedTextCommandContext,
  result: EditorOperationResult<TData>,
  label: string,
): EditorOperationResult<TData> {
  if (context.commitOperationResult) {
    context.commitOperationResult({ label, result });
    return result;
  }

  if (result.ok) {
    context.setDocument?.(result.document);
  }

  return result;
}

/**
 * Helper for commands that need one or more selected cues.
 */
export function hasSelectedCues(context: TimedTextCommandContext): boolean {
  const selection = context.selection?.getSelection();
  return selection ? getSelectedCueIds(selection).length > 0 : false;
}

/**
 * Helper for commands that need exactly one selected cue.
 */
export function hasSingleSelectedCue(context: TimedTextCommandContext): boolean {
  const selection = context.selection?.getSelection();
  return selection ? getSelectedCueIds(selection).length === 1 : false;
}
