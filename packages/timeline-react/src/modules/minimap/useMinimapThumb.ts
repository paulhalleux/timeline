import React from "react";

import { shouldApplyHorizontalMouseEvent } from "../../utils/mouse-event.ts";
import { useMinimapContext } from "./MinimapProvider.tsx";
import { useMinimap } from "./useMinimap.ts";

type UseMinimapThumbArgs = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
};

export const useMinimapThumb = (args: UseMinimapThumbArgs) => {
  const [state, api] = useMinimap();
  const { containerRef, containerRect } = useMinimapContext();

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      args.onMouseDown?.(e);
    },
    [args],
  );

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      args.onClick?.(e);
    },
    [args],
  );

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      args.onPointerDown?.(e);
    },
    [args],
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      args.onPointerUp?.(e);
    },
    [args],
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      if (!shouldApplyHorizontalMouseEvent(e)) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const positionRatio =
        (state.visibleStartRatio * rect.width + e.movementX) / rect.width;

      api.setVisibleStartRatio(positionRatio);
      args.onPointerMove?.(e);
    },
    [api, args, containerRef, state.visibleStartRatio],
  );

  const style = React.useMemo<React.CSSProperties>(() => {
    if (containerRect?.width === undefined) {
      return {};
    }

    const minWidth =
      typeof args.style?.minWidth === "number" ? args.style?.minWidth : 0;

    const width = state.visibleSizeRatio * containerRect.width;
    const actualWidth = containerRect.width - Math.max(0, minWidth - width);

    return {
      position: "absolute",
      left: state.visibleStartRatio * actualWidth,
      width,
      top: 0,
      bottom: 0,
      ...args.style,
    };
  }, [
    containerRect?.width,
    state.visibleStartRatio,
    state.visibleSizeRatio,
    args.style,
  ]);

  return {
    onClick,
    onMouseDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style,
  };
};
