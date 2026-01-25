import { TimelineApi } from "../timeline";
import {
  Playable,
  Playhead,
  UnitPosition,
  ViewportPosition,
} from "../timeline-components";
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
 * - ViewportPosition (computed based on unit position and timeline viewport)
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
  world.addComponent(playheadEntity, UnitPosition, { unit: initialPosition });
  world.addComponent(playheadEntity, ViewportPosition, { px: 0 });
  world.addComponent(playheadEntity, Playable, { isPlaying: false });

  return playheadEntity;
};
