import { createActionScope } from "@ptl/action-core";
import type { ActionSurface } from "@ptl/action-core";

import { defaultTimedTextActions } from "./defaults";
import { TIMED_TEXT_ACTION_SCOPE_ID } from "./ids";
import type {
  TimedTextActionContext,
  TimedTextActionDefinition,
  TimedTextActionScope,
} from "./types";

export function createTimedTextActionScope(options: {
  getContext: () => TimedTextActionContext;
  actions?: Iterable<TimedTextActionDefinition>;
  id?: string;
  surfaces?: Iterable<ActionSurface>;
}): TimedTextActionScope {
  return createActionScope({
    id: options.id ?? TIMED_TEXT_ACTION_SCOPE_ID,
    getContext: options.getContext,
    actions: options.actions ?? defaultTimedTextActions,
    surfaces: options.surfaces,
  });
}
