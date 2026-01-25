// timeline-components.ts
import { createComponent } from "@ptl/ecs";

export const Playhead = createComponent("Playhead", {});
export const UnitPosition = createComponent("Position", {
  unit: 0,
});
export const ViewportPosition = createComponent("ViewportPosition", {
  px: 0,
});
export const Playable = createComponent("Playable", {
  isPlaying: false,
});
