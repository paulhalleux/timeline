import React from "react";
import { usePannerContext } from "./PannerProvider.tsx";
import { useMeasure } from "../../utils/useMeasure.ts";

type UsePannerHandleArgs = {
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
};

export const usePannerHandle = (args: UsePannerHandleArgs) => {
  const [handleRef, , handleSize] = useMeasure<HTMLDivElement>();
  const { setDelta, delta, containerSize, containerRef } = usePannerContext();
  const startX = React.useRef(0);

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      startX.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
      args.onPointerDown?.(event);
    },
    [args],
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const halfRectWidth = rect.width / 2;
      const cursorX = event.clientX - rect.left;
      const dx = cursorX - halfRectWidth;

      setDelta(Math.max(-1, Math.min(1, dx / halfRectWidth)));

      args.onPointerMove?.(event);
    },
    [args, containerRef, setDelta],
  );

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      startX.current = 0;
      event.currentTarget.releasePointerCapture(event.pointerId);
      args.onPointerUp?.(event);
    },
    [args],
  );

  const { width } = containerSize;
  const deltaWidth =
    ((width ?? 0) / 2) * delta - ((handleSize.width ?? 0) / 2) * delta;
  const style: React.CSSProperties = {
    cursor: "grab",
    transform: "translateX(-50%)",
    position: "absolute",
    left: `${(width ?? 0) / 2 + deltaWidth}px`,
    ...args.style,
  };

  return {
    ref: handleRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style,
  };
};
