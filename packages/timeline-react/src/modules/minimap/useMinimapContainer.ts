import React from "react";
import { useTimeline } from "../../TimelineProvider.tsx";
import { useMinimap } from "./useMinimap.ts";
import { useMeasure } from "../../utils/useMeasure.ts";

type UseMinimapContainerArgs = {
  zoomSensitivity?: number;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export const useMinimapContainer = ({
  zoomSensitivity = 1,
  ...args
}: UseMinimapContainerArgs) => {
  const timeline = useTimeline();
  const [state, api] = useMinimap();

  const [ref, containerRef, containerSize] = useMeasure<HTMLDivElement>();

  const onWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const viewportWidthPx = timeline.getViewport().select((s) => s.widthPx);

      const delta = e.deltaY;
      const zoomChange = (delta > 0 ? -0.05 : 0.05) * zoomSensitivity;
      const newZoom = Math.min(
        1,
        Math.max(0, timeline.getZoomLevel() + zoomChange),
      );

      timeline.setZoom(newZoom, viewportWidthPx / 2);
      timeline.setCurrentPosition(
        Math.min(
          timeline.getStore().select((s) => s.current),
          state.totalRange - timeline.getVisibleRange(),
        ),
      );

      args.onWheel?.(e);
    },
    [args, state.totalRange, timeline, zoomSensitivity],
  );

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const positionRatio = (e.clientX - rect.left) / rect.width;
      api.moveCenterTo(positionRatio);
      args.onClick?.(e);
    },
    [api, args, containerRef],
  );

  return {
    ref,
    containerRef,
    containerSize,
    onWheel,
    onClick,
  };
};
