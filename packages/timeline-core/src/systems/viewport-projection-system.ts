import { TimelineApi } from "../timeline";
import { createReactiveSystem, Query } from "@ptl/ecs";
import { UnitPosition, ViewportPosition } from "../timeline-components";

export const createViewportProjectionSystem = (timeline: TimelineApi) => {
  return createReactiveSystem(
    Query.has(UnitPosition),
    {
      onUpdate(world, entity, components) {
        if (!world.hasComponent(entity, ViewportPosition)) {
          return;
        }

        world.updateComponent(entity, ViewportPosition, () => ({
          px: timeline.projectToChunk(components.Position.unit),
        }));
      },
    },
    [
      timeline
        .getViewport()
        .getStore()
        .derive((s) => s.visibleRange),
    ],
  );
};
