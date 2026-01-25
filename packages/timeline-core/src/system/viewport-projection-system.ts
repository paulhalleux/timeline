import { createReactiveSystem, Query } from "@ptl/ecs";
import { UnitPosition, ViewportPosition } from "../timeline-components";
import { TimelineApi } from "../timeline";

export const createViewportProjectionSystem = (timeline: TimelineApi) => {
  return createReactiveSystem(
    Query.has(UnitPosition),
    Query.has(ViewportPosition),
    {
      onEnter(world, entity, { unitPosition }) {
        world.updateComponent(entity, ViewportPosition, (value) => {
          value.px = timeline.projectToChunk(unitPosition.unit);
        });
      },
      onUpdate(world, entity, { unitPosition }) {
        world.updateComponent(entity, ViewportPosition, (value) => {
          value.px = timeline.projectToChunk(unitPosition.unit);
        });
      },
    },
  );
};
