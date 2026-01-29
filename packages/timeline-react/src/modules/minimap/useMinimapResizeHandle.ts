import React from "react";

import { shouldApplyHorizontalMouseEvent } from "../../utils/mouse-event.ts";
import { useMinimapContext } from "./MinimapProvider.tsx";
import { useMinimap } from "./useMinimap.ts";

type UseMinimapResizeHandleArgs = {
  position: "left" | "right";
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
};

export const useMinimapResizeHandle = ({
  position,
  ...args
}: UseMinimapResizeHandleArgs) => {
  const { containerSize } = useMinimapContext();
  const [, api] = useMinimap();

  const containerWidth = containerSize.width ?? 0;

  const onMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      args.onMouseDown?.(event);
    },
    [args],
  );

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      args.onPointerDown?.(event);
    },
    [args],
  );

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.releasePointerCapture(event.pointerId);
      args.onPointerUp?.(event);
    },
    [args],
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        if (!shouldApplyHorizontalMouseEvent(event)) {
          return;
        }
        const delta = (1 / containerWidth) * event.movementX;
        api.extendVisibleRange(position === "left" ? -delta : delta, position);
      }

      args.onPointerMove?.(event);
    },
    [api, args, containerWidth, position],
  );

  const style: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    cursor: "ew-resize",
    left: position === "left" ? 0 : undefined,
    right: position === "right" ? 0 : undefined,
    ...args.style,
  };

  return {
    onMouseDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style,
  };
};
