import { TimelineApi } from "../timeline";
import { createReactiveSystem, Query } from "@ptl/ecs";
import { UnitPosition, ViewportPosition } from "../components";

export const createViewportProjectionSystem = (timeline: TimelineApi) => {
  const $mounted = timeline.$mounted.filter(Boolean);
  const $chunkChange = timeline.getStore().map((s) => s.chunkIndex);
  const $rangeChange = timeline
    .getViewport()
    .getStore()
    .map((s) => s.visibleRange);

  const updateViewportPosition = (entity: number, unit: number) => {
    const px = timeline.projectToChunk(unit);
    const world = timeline.getWorld();
    if (!world.hasComponent(entity, ViewportPosition)) {
      world.addComponent(entity, ViewportPosition, { px });
    } else {
      world.updateComponent(entity, ViewportPosition, () => ({ px }));
    }
  };

  return createReactiveSystem(
    Query.has(UnitPosition),
    {
      onEnter(_, entity, { UnitPosition: { unit, projectable } }) {
        if (!projectable || !timeline.$mounted.get()) {
          return;
        }
        updateViewportPosition(entity, unit);
      },
      onUpdate(_, entity, { UnitPosition: { unit, projectable } }) {
        if (!projectable || !timeline.$mounted.get()) {
          return;
        }
        updateViewportPosition(entity, unit);
      },
    },
    [$mounted, $chunkChange, $rangeChange],
  );
};
