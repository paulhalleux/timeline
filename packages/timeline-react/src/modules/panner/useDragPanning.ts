import React from "react";

import { useTimeline } from "../../timeline";

export const useDragPanning = <T extends HTMLElement = HTMLElement>() => {
  const timeline = useTimeline();
  const [dragging, setDragging] = React.useState(false);

  const onMouseDown = React.useCallback((e: React.PointerEvent<T>) => {
    if (e.button !== 1) {
      return;
    }

    e.preventDefault();
    setDragging(true);
  }, []);

  const onPointerMove = React.useCallback(
    (e: PointerEvent) => {
      if (!dragging) {
        return;
      }
      timeline.panByPx(-e.movementX);
    },
    [dragging, timeline],
  );

  const onPointerUp = React.useCallback(() => {
    setDragging(false);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    if (dragging) {
      window.addEventListener("pointermove", onPointerMove, {
        signal: controller.signal,
      });
      window.addEventListener("pointerup", onPointerUp, {
        signal: controller.signal,
      });
    }

    return () => {
      controller.abort();
    };
  }, [dragging, onPointerMove, onPointerUp, timeline]);

  return {
    onMouseDown,
  };
};
