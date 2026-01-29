import React from "react";

import { useMeasure } from "../../utils/useMeasure.ts";
import { PannerContext } from "./PannerProvider.tsx";
import { usePanner } from "./usePanner.ts";
import { usePannerHandle } from "./usePannerHandle.ts";

export type PannerRootProps = React.ComponentProps<"div"> & {
  onPan?: (delta: number) => void;
};

const PannerRoot = ({ children, style, onPan, ...rest }: PannerRootProps) => {
  const { delta, setDelta } = usePanner({ onPan });
  const [ref, containerRef, containerSize] = useMeasure<HTMLDivElement>();

  return (
    <PannerContext.Provider
      value={React.useMemo(
        () => ({ containerRef, containerSize, delta, setDelta }),
        [containerRef, containerSize, delta, setDelta],
      )}
    >
      <div ref={ref} style={{ ...style, position: "relative" }} {...rest}>
        {children}
      </div>
    </PannerContext.Provider>
  );
};

type PannerHandleProps = React.ComponentProps<"div">;

const PannerHandle = ({
  children,
  onPointerDown,
  onPointerUp,
  onPointerMove,
  style,
  ...rest
}: PannerHandleProps) => {
  const handleProps = usePannerHandle({
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style,
  });

  return (
    <div {...handleProps} {...rest}>
      {children}
    </div>
  );
};

export const Panner = {
  Root: PannerRoot,
  Handle: PannerHandle,
};
