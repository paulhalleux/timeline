import React, { useState } from "react";
import { useTimeline } from "../TimelineProvider.tsx";
import { useMinimap } from "./useMinimap.ts";
import { useMinimapContext } from "./Minimap.tsx";

type UseMinimapThumbArgs = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
};

export const useMinimapThumb = (args: UseMinimapThumbArgs) => {
  const timeline = useTimeline();
  const [state, api] = useMinimap();

  const { containerRef, containerSize } = useMinimapContext();

  const [dragging, setDragging] = useState(false);
  const [clientX, setClientX] = React.useState(0);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
      setClientX(e.clientX);
      args.onMouseDown?.(e);
    },
    [args],
  );

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      args.onClick?.(e);
    },
    [args],
  );

  React.useEffect(() => {
    const handleMouseUpGlobal = () => setDragging(false);
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!dragging) {
        return;
      }

      const deltaX = e.clientX - clientX;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const positionRatio =
        (state.visibleStartRatio * rect.width + deltaX) / rect.width;

      api.setVisibleStartRatio(positionRatio);
      setClientX(e.clientX);
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("mousemove", handleMouseMoveGlobal);

    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("mousemove", handleMouseMoveGlobal);
    };
  }, [
    api,
    clientX,
    containerRef,
    dragging,
    state.visibleSizeRatio,
    state.visibleStartRatio,
    timeline,
  ]);

  const gerContainerInlinePadding = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return { paddingLeft: 0, paddingRight: 0, borderWidth: 0 };
    }
    const style = window.getComputedStyle(container);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const borderWidth = parseFloat(style.borderWidth) || 0;
    return { paddingLeft, paddingRight, borderWidth };
  }, [containerRef]);

  const style = React.useMemo<React.CSSProperties>(() => {
    const { paddingRight, paddingLeft, borderWidth } =
      gerContainerInlinePadding();
    if (containerSize.width === null) {
      return {};
    }

    return {
      position: "absolute",
      left:
        state.visibleStartRatio *
          (containerSize.width - paddingLeft - paddingRight - borderWidth) +
        paddingLeft,
      width:
        state.visibleSizeRatio *
          (containerSize.width - paddingLeft - paddingRight - borderWidth) -
        1,
      top: 0,
      bottom: 0,
      ...args.style,
    };
  }, [
    gerContainerInlinePadding,
    containerSize.width,
    state.visibleStartRatio,
    state.visibleSizeRatio,
    args.style,
  ]);

  return {
    onClick,
    onMouseDown,
    style,
  };
};
