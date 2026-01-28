import React from "react";
import { useMinimapThumb } from "./useMinimapThumb.ts";
import { useMinimapContainer } from "./useMinimapContainer.ts";
import { MinimapContext } from "./MinimapProvider.tsx";

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
  ...rest
}: MinimapThumbProps) => {
  const thumb = useMinimapThumb({
    onClick,
    onMouseDown,
    style,
  });

  return (
    <div {...thumb} {...rest}>
      {children}
    </div>
  );
};

export const Minimap = {
  Root: MinimapRoot,
  Thumb: MinimapThumb,
};
