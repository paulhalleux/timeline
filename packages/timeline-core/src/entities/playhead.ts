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
  connect: (element: HTMLElement | null) => void;
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
  let abortController: AbortController | null = null;

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

  const setPosition = (unit: number) => {
    console.log("Setting playhead position to unit:", unit);
    world.updateComponent(playheadEntity, UnitPosition, () => ({
      unit,
    }));
  };

  const getPosition = () => {
    const position = world.getComponent(playheadEntity, UnitPosition);
    return position?.unit ?? 0;
  };

  return {
    entity: playheadEntity,
    isPlaying: () => {
      const playable = world.getComponent(playheadEntity, Playable);
      return playable?.isPlaying ?? false;
    },
    setPlaying: (isPlaying: boolean) => {
      world.updateComponent(playheadEntity, Playable, () => ({
        isPlaying,
      }));
    },
    getPosition,
    setPosition,
    recompute: () => {},
    connect: (element: HTMLElement | null) => {
      if (abortController) {
        abortController.abort();
      }
      if (!element) return;

      abortController = new AbortController();
      const signal = abortController.signal;

      let isDragging = false;

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        element.setPointerCapture(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const movementX = e.movementX;
        setPosition(getPosition() + timeline.projectToUnit(movementX));
      };

      const onPointerUp = (e: PointerEvent) => {
        isDragging = false;
        element.releasePointerCapture(e.pointerId);
      };

      element.addEventListener("pointerdown", onPointerDown, { signal });
      window.addEventListener("pointermove", onPointerMove, { signal });
      window.addEventListener("pointerup", onPointerUp, { signal });
    },
  };
};
