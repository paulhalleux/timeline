// timeline-components.ts
import { createComponent } from "@ptl/ecs";

export const Playhead = createComponent("playhead", {});
export const UnitPosition = createComponent("unitPosition", {
  unit: 0,
});
export const ViewportPosition = createComponent("viewportPosition", {
  px: 0,
});
export const Playable = createComponent("playable", {
  isPlaying: false,
});
