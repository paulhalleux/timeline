import { cueActions, defaultCueActions } from "./cue-actions";
import { defaultTimingActions, timingActions } from "./timing-actions";
import type { TimedTextActionDefinition } from "./types";

export const timedTextActions = {
  ...cueActions,
  ...timingActions,
};

export const defaultTimedTextActions: TimedTextActionDefinition[] = [
  ...defaultCueActions,
  ...defaultTimingActions,
];
