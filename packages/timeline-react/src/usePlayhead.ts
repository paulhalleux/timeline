import { useComponent } from "@ptl/ecs-react";
import { Playable, PlayheadModule, ViewportPosition } from "@ptl/timeline-core";

import { useTimeline } from "./timeline";

export const usePlayhead = () => {
  const timeline = useTimeline();
  const module = timeline.getModule(PlayheadModule);

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

  return {
    leftPx: viewportPosition?.px ?? 0,
    playing: playing?.isPlaying ?? false,
    module,
  };
};
