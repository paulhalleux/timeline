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
  const module = timeline.getModule(PlayheadModule);

  const state = useSignal(module.getStore());
  const leftPx = useSignalSelector(
    ([{ position }]) => {
      return timeline.projectToChunk(position);
    },
    [module.getStore(), timeline.getViewport().getStore()] as const,
  );

  return [
    {
      leftPx,
      playing: state.isPlaying,
      position: state.position,
    },
    module,
  ];
};

export const usePlayheadApi = (): PlayheadApi => {
  const timeline = useTimeline();
  return timeline.getModule(PlayheadModule);
};
