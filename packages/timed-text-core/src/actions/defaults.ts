import { cueActions, defaultCueActions } from "./cue-actions";
import { defaultTimingActions, timingActions } from "./timing-actions";

export const timedTextActions = {
  ...cueActions,
  ...timingActions,
};

export const defaultTimedTextActions = [
  ...defaultCueActions,
  ...defaultTimingActions,
];
