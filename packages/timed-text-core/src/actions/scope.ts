import { createActionScope } from "@ptl/action-core";
import type {
  ActionDefinition,
  ActionScope,
  ActionSurface,
} from "@ptl/action-core";

import { defaultTimedTextActions } from "./defaults";
import { TIMED_TEXT_ACTION_SCOPE_ID } from "./metadata";
import type { TimedTextActionContext } from "./context";

export function createTimedTextActionScope(options: {
  getContext: () => TimedTextActionContext;
  actions?: Iterable<ActionDefinition<TimedTextActionContext>>;
  id?: string;
  surfaces?: Iterable<ActionSurface>;
}): ActionScope<TimedTextActionContext> {
  return createActionScope({
    id: options.id ?? TIMED_TEXT_ACTION_SCOPE_ID,
    getContext: options.getContext,
    actions: options.actions ?? defaultTimedTextActions,
    surfaces: options.surfaces,
  });
}
