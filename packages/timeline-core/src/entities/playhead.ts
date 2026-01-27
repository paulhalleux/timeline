import { TimelineApi } from "../timeline";
import { Playable, Playhead, UnitPosition } from "../components";
import { Entity } from "@ptl/ecs";

export type CreatePlayheadOptions = {
  initialPosition?: number;
};

/**
 * Creates a playhead entity in the timeline's world.
 *
 * Attaches components:
 * - Playhead
 * - UnitPosition (with initial position if provided)
 * - Playable
 *
 * @param timeline - The timeline API instance.
 * @param options - Optional configuration for the playhead.
 * @returns The created playhead entity.
 */
export const createPlayhead = (
  timeline: TimelineApi,
  options?: CreatePlayheadOptions,
): Entity => {
  const world = timeline.getWorld();
  const playheadEntity = world.createEntity();

  const initialPosition = options?.initialPosition ?? 0;
  world.addComponent(playheadEntity, Playhead, {});
  world.addComponent(playheadEntity, Playable, { isPlaying: false });
  world.addComponent(playheadEntity, UnitPosition, {
    unit: initialPosition,
    projectable: true,
  });

  return playheadEntity;
};
