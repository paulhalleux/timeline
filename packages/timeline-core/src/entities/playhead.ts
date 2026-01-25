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

export type PlayheadEntity = {
  entity: Entity;
  getPosition: () => number;
  setPosition: (position: number) => void;
  isPlaying: () => boolean;
  setPlaying: (isPlaying: boolean) => void;
  recompute: () => void;
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
): PlayheadEntity => {
  const world = timeline.getWorld();

  const playheadEntity = world.createEntity();

  world.addComponent(playheadEntity, Playhead, {});
  world.addComponent(playheadEntity, UnitPosition, {
    unit: options?.initialPosition ?? 0,
  });
  world.addComponent(playheadEntity, ViewportPosition, {
    px:
      timeline.unitToPx(options?.initialPosition ?? 0) -
      timeline.getTranslatePx(),
  });
  world.addComponent(playheadEntity, Playable, {
    isPlaying: false,
  });

  return {
    entity: playheadEntity,
    isPlaying: () => {
      const playable = world.getComponent(playheadEntity, Playable);
      return playable?.isPlaying ?? false;
    },
    setPlaying: (isPlaying: boolean) => {
      world.updateComponent(playheadEntity, Playable, (value) => {
        value.isPlaying = isPlaying;
      });
    },
    getPosition: () => {
      const position = world.getComponent(playheadEntity, UnitPosition);
      return position?.unit ?? 0;
    },
    setPosition: (position: number) => {
      world.updateComponent(playheadEntity, UnitPosition, (value) => {
        value.unit = position;
      });
      world.updateComponent(playheadEntity, ViewportPosition, (value) => {
        value.px = timeline.unitToPx(position) - timeline.getTranslatePx();
      });
    },
    recompute: () => {
      const position = world.getComponent(playheadEntity, UnitPosition);
      if (!position) return;

      const px = timeline.unitToPx(position.unit) - timeline.getTranslatePx();
      world.updateComponent(playheadEntity, ViewportPosition, (value) => {
        value.px = px;
      });
    },
  };
};
