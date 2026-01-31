import { type PlayheadApi, PlayheadModule } from "@ptl/timeline-core";
import { useSyncExternalStore } from "react";

import { useTimeline } from "../../timeline";

type PlayheadState = {
  leftPx: number;
  playing: boolean;
  position: number;
};

export const usePlayhead = (): [PlayheadState, PlayheadApi] => {
  const timeline = useTimeline();
  const module = timeline.getModule(PlayheadModule);

  const state = useSyncExternalStore(
    (callback) => module.getStore().subscribe(callback),
    () => module.getStore().get(),
    () => module.getStore().get(),
  );

  return [
    {
      leftPx: timeline.projectToChunk(state.position),
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
