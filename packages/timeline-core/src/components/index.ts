import { createComponent } from "@ptl/ecs";

export const Playhead = createComponent("Playhead", {});
export const UnitPosition = createComponent("UnitPosition", {
  unit: 0,
  projectable: true,
});
export const ViewportPosition = createComponent("ViewportPosition", {
  px: 0,
});
export const Playable = createComponent("Playable", {
  isPlaying: false,
});
