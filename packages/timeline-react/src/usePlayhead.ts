import { Playable, PlayheadModule, ViewportPosition } from "@ptl/timeline-core";
import { useTimeline } from "./TimelineProvider.tsx";
import { useComponent } from "@ptl/ecs-react";

export const usePlayhead = () => {
  const timeline = useTimeline();
  const module = timeline.getModule(PlayheadModule);

  const viewportPosition = useComponent(
    timeline.getWorld(),
    module.getPlayhead()?.entity ?? -1,
    ViewportPosition,
  );

  console.log(viewportPosition);

  const playing = useComponent(
    timeline.getWorld(),
    module.getPlayhead()?.entity ?? -1,
    Playable,
  );

  return {
    leftPx: viewportPosition?.px ?? 0,
    playing: playing?.isPlaying ?? false,
    module,
  };
};
