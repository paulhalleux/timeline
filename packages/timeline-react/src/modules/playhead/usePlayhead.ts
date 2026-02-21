import { useStore, useStoreCombine } from "@ptl/store/react";
import { type PlayheadApi, PlayheadModule } from "@ptl/timeline-core";

import { useTimeline } from "../../timeline";

type PlayheadState = {
  leftPx: number;
  playing: boolean;
  position: number;
};

export const usePlayhead = (): [PlayheadState, PlayheadApi] => {
  const timeline = useTimeline();
  const playhead = PlayheadModule.for(timeline);

  const state = useStore(playhead.getStore());
  const leftPx = useStoreCombine(
    [playhead.getStore(), timeline.getViewport().getStore()] as const,
    ([playheadState]) => {
      return timeline.projectToChunk(playheadState.position);
    },
  );

  return [
    {
      leftPx,
      playing: state.isPlaying,
      position: state.position,
    },
    playhead,
  ];
};

export const usePlayheadApi = (): PlayheadApi => {
  const timeline = useTimeline();
  return PlayheadModule.for(timeline);
};
