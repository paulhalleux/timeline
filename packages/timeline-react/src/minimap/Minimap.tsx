import React from "react";
import { useMinimapThumb } from "./useMinimapThumb.ts";
import { useMinimapContainer } from "./useMinimapContainer.ts";

type MinimapContextType = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerSize: { width: number | null; height: number | null };
};

const MinimapContext = React.createContext<MinimapContextType | null>(null);
export const useMinimapContext = () => {
  const context = React.useContext(MinimapContext);
  if (!context) {
    throw new Error(
      "Minimap components must be used within a Minimap.Root component",
    );
  }
  return context;
};

export type MinimapRootProps = React.ComponentProps<"div">;
const MinimapRoot = ({
  children,
  onWheel,
  onClick,
  ...rest
}: MinimapRootProps) => {
  const { ref, containerRef, containerSize, ...containerProps } =
    useMinimapContainer({
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
