import React from "react";
import { useMinimapThumb } from "./useMinimapThumb.ts";
import { useMinimapContainer } from "./useMinimapContainer.ts";
import { MinimapContext } from "./MinimapProvider.tsx";
import { useMinimapResizeHandle } from "./useMinimapResizeHandle.ts";

export type MinimapRootProps = React.ComponentProps<"div"> & {
  zoomSensitivity?: number;
};

const MinimapRoot = ({
  children,
  onWheel,
  onClick,
  zoomSensitivity,
  ...rest
}: MinimapRootProps) => {
  const { ref, containerRef, containerSize, ...containerProps } =
    useMinimapContainer({
      zoomSensitivity,
      onWheel,
      onClick,
    });

  return (
    <MinimapContext.Provider
      value={React.useMemo(
        () => ({ containerRef, containerSize }),
        [containerRef, containerSize],
      )}
    >
      <div ref={ref} {...containerProps} {...rest}>
        {children}
      </div>
    </MinimapContext.Provider>
  );
};

export type MinimapThumbProps = React.ComponentProps<"div">;
const MinimapThumb = ({
  children,
  style,
  onClick,
  onMouseDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...rest
}: MinimapThumbProps) => {
  const thumb = useMinimapThumb({
    onClick,
    onMouseDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style,
  });

  return (
    <div {...thumb} {...rest}>
      {children}
    </div>
  );
};

export type ResizeHandleProps = React.ComponentProps<"div"> & {
  position?: "left" | "right";
};

const MinimapResizeHandle = ({
  children,
  style,
  position = "left",
  onMouseDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...rest
}: ResizeHandleProps) => {
  const handleProps = useMinimapResizeHandle({
    position,
    style,
    onMouseDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  });

  return (
    <div {...handleProps} {...rest}>
      {children}
    </div>
  );
};

export const Minimap = {
  Root: MinimapRoot,
  Thumb: MinimapThumb,
  ResizeHandle: MinimapResizeHandle,
};
