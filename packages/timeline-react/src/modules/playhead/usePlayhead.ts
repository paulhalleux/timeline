import { useComponent } from "@ptl/ecs-react";
import {
  Playable,
  type PlayheadApi,
  PlayheadModule,
  UnitPosition,
  ViewportPosition,
} from "@ptl/timeline-core";

import { useTimeline } from "../../timeline";

type PlayheadState = {
  leftPx: number;
  playing: boolean;
  position: number;
};

export const usePlayhead = (): [PlayheadState, PlayheadApi] => {
  const timeline = useTimeline();
  const module = timeline.getModule(PlayheadModule);

  const unitPosition = useComponent(
    timeline.getWorld(),
    module.getEntity() ?? -1,
    UnitPosition,
  );

  const viewportPosition = useComponent(
    timeline.getWorld(),
    module.getEntity() ?? -1,
    ViewportPosition,
  );

  const playing = useComponent(
    timeline.getWorld(),
    module.getEntity() ?? -1,
    Playable,
  );

  return [
    {
      leftPx: viewportPosition?.px ?? 0,
      playing: playing?.isPlaying ?? false,
      position: unitPosition?.unit ?? 0,
    },
    module,
  ];
};

export const usePlayheadApi = (): PlayheadApi => {
  const timeline = useTimeline();
  return timeline.getModule(PlayheadModule);
};
