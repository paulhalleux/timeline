import type { MinimapModule } from "@ptl/timeline-core";
import { useMinimap, useTimeline, useViewport } from "@ptl/timeline-react";
import React, { useRef } from "react";

export const Minimap = ({ minimap }: { minimap: MinimapModule }) => {
  const timeline = useTimeline();
  const state = useMinimap(minimap);
  const { viewportWidthPx } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = React.useState(false);
  const [clientX, setClientX] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(true);
    setClientX(e.clientX);
  };

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

      minimap.setVisibleStartRatio(positionRatio);
      setClientX(e.clientX);
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("mousemove", handleMouseMoveGlobal);

    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("mousemove", handleMouseMoveGlobal);
    };
  }, [
    clientX,
    dragging,
    minimap,
    state.visibleSizeRatio,
    state.visibleStartRatio,
    timeline,
    viewportWidthPx,
  ]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomChange = delta > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(
      1,
      Math.max(0, timeline.getZoomLevel() + zoomChange),
    );
    timeline.setZoom(newZoom, viewportWidthPx / 2);
    timeline.setCurrentPosition(
      Math.min(
        timeline.getStore().select((s) => s.current),
        minimap.getState().totalRange - timeline.getVisibleRange(),
      ),
    );
  };

  const onClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const positionRatio = (e.clientX - rect.left) / rect.width;
    minimap.moveCenterTo(positionRatio);
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onClick={onClick}
      style={{
        position: "relative",
        height: 16,
        background: "#222",
        cursor: "pointer",
      }}
    >
      {/* visible window */}
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: `${state.visibleStartRatio * 100}%`,
          width: `${state.visibleSizeRatio * 100}%`,
          top: 0,
          bottom: 0,
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      />
    </div>
  );
};
