import React from "react";

import { useTimeline } from "../../timeline";
import { shouldApplyHorizontalMouseEvent } from "../../utils/mouse-event.ts";
import { usePlayheadApi } from "./usePlayhead.ts";

export const usePlayheadHandle = () => {
  const timeline = useTimeline();
  const playheadApi = usePlayheadApi();
  return {
    onPointerDown: React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      [],
    ),
    onPointerMove: React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!shouldApplyHorizontalMouseEvent(e)) return;

        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          const delta = timeline.pxToUnit(Math.abs(e.movementX));
          if (e.movementX < 0) {
            playheadApi.moveBackward(delta);
          } else if (e.movementX > 0) {
            playheadApi.moveForward(delta);
          }
        }
      },
      [playheadApi, timeline],
    ),
    onPointerUp: React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }, []),
  };
};
