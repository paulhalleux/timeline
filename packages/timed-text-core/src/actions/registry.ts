import { createTypedActionRegistry } from "@ptl/action-core";
import type { ActionSurface } from "@ptl/action-core";

import { timedTextActions } from "./defaults";
import { TIMED_TEXT_ACTION_SCOPE_ID } from "./ids";
import type { TimedTextActionContext } from "./types";

/**
 * Create a typed timed-text action registry.
 *
 * The returned registry autocompletes action keys such as `insertCue` and
 * validates the matching invocation payload at compile time.
 */
export function createTimedTextActionRegistry(options: {
  getContext: () => TimedTextActionContext;
  id?: string;
  surfaces?: Iterable<ActionSurface>;
}) {
  return createTypedActionRegistry({
    id: options.id ?? TIMED_TEXT_ACTION_SCOPE_ID,
    getContext: options.getContext,
    actions: timedTextActions,
    surfaces: options.surfaces,
  });
}
