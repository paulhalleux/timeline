import type {
  ActionDescriptor,
  ActionGuardResult,
  ActionInvocation,
} from "@ptl/action-core";

import type { EditorTimedTextDocument } from "../editor-model";
import { operationSuccess } from "../operations";
import type { TimedTextActionContext } from "./context";

export function documentActionResult(document: EditorTimedTextDocument) {
  return operationSuccess(document, undefined);
}

export function requirePayload<TPayload>(
  action: Pick<ActionDescriptor, "id">,
  invocation: ActionInvocation<TPayload>,
): TPayload {
  if (invocation.payload === undefined) {
    throw new Error(`Action "${action.id}" requires a payload.`);
  }

  return invocation.payload;
}

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
