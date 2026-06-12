export const TIMED_TEXT_ACTION_SCOPE_ID = "timedText";

export const TIMED_TEXT_CREATE_CUE_ACTION_ID = "timedText.cue.create";
export const TIMED_TEXT_INSERT_CUE_ACTION_ID = "timedText.cue.insert";
export const TIMED_TEXT_DELETE_CUE_ACTION_ID = "timedText.cue.delete";
export const TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID = "timedText.cue.updateText";
export const TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID =
  "timedText.cue.updateTiming";
export const TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID =
  "timedText.cue.replaceRange";
export const TIMED_TEXT_SPLIT_CUE_ACTION_ID = "timedText.cue.split";
export const TIMED_TEXT_MERGE_CUES_ACTION_ID = "timedText.cue.merge";
export const TIMED_TEXT_SHIFT_CUES_ACTION_ID = "timedText.cues.shift";
export const TIMED_TEXT_SCALE_CUES_ACTION_ID = "timedText.cues.scale";
export const TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID =
  "timedText.cues.snapToFrames";
export const TIMED_TEXT_FIX_OVERLAPS_ACTION_ID = "timedText.cues.fixOverlaps";
export const TIMED_TEXT_ADJUST_GAPS_ACTION_ID = "timedText.cues.adjustGaps";
export const TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID =
  "timedText.cues.sortByTime";

export const TIMED_TEXT_ACTION_IDS = {
  createCue: TIMED_TEXT_CREATE_CUE_ACTION_ID,
  insertCue: TIMED_TEXT_INSERT_CUE_ACTION_ID,
  deleteCue: TIMED_TEXT_DELETE_CUE_ACTION_ID,
  updateCueText: TIMED_TEXT_UPDATE_CUE_TEXT_ACTION_ID,
  updateCueTiming: TIMED_TEXT_UPDATE_CUE_TIMING_ACTION_ID,
  replaceCueRange: TIMED_TEXT_REPLACE_CUE_RANGE_ACTION_ID,
  splitCue: TIMED_TEXT_SPLIT_CUE_ACTION_ID,
  mergeCues: TIMED_TEXT_MERGE_CUES_ACTION_ID,
  shiftCues: TIMED_TEXT_SHIFT_CUES_ACTION_ID,
  scaleCues: TIMED_TEXT_SCALE_CUES_ACTION_ID,
  snapCuesToFrames: TIMED_TEXT_SNAP_CUES_TO_FRAMES_ACTION_ID,
  fixOverlaps: TIMED_TEXT_FIX_OVERLAPS_ACTION_ID,
  adjustGaps: TIMED_TEXT_ADJUST_GAPS_ACTION_ID,
  sortCuesByTime: TIMED_TEXT_SORT_CUES_BY_TIME_ACTION_ID,
};

export const TIMED_TEXT_ACTION_CATEGORY = "Timed Text";
export const TIMED_TEXT_ACTION_SOURCE = "@ptl/timed-text-core";
