import { useSignal, useSignalSelector } from "@ptl/signal-react";
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

  const state = useSignal(playhead.getStore());
  const leftPx = useSignalSelector(
    ([{ position }]) => {
      return timeline.projectToChunk(position);
    },
    [playhead.getStore(), timeline.getViewport().getStore()] as const,
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
