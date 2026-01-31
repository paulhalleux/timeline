import { clsx } from "clsx";
import React from "react";

import styles from "./Timeline.module.css";
import { useTimeline } from "./TimelineProvider.tsx";
import { useTimelineStore } from "./useTimelineStore.ts";

type TimelineRootProps = React.ComponentProps<"div">;
const TimelineRoot = ({ children, className, ...rest }: TimelineRootProps) => {
  return (
    <div className={clsx(styles.root, className)} {...rest}>
      {children}
    </div>
  );
};

type TimelineLayersProps = React.ComponentProps<"div">;
const TimelineLayers = ({
  children,
  className,
  ...rest
}: TimelineLayersProps) => {
  return (
    <div className={clsx(styles.layers, className)} {...rest}>
      {children}
    </div>
  );
};

type TimelineLayerProps = React.ComponentProps<"div"> & {
  layer: number;
};
export const TimelineLayer = ({
  children,
  className,
  layer,
  style,
  ...rest
}: TimelineLayerProps) => {
  return (
    <div
      className={clsx(styles.layer, className)}
      style={React.useMemo(
        () => ({
          zIndex: layer,
          ...style,
        }),
        [layer, style],
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

type TimelineViewportProps = React.ComponentProps<"div">;
const TimelineViewport = ({
  children,
  className,
  ...rest
}: TimelineViewportProps) => {
  const timeline = useTimeline();
  const mounted = useTimelineStore((tl) => tl.getViewport().isConnected());
  return (
    <div
      ref={(el) => timeline.connect(el)}
      className={clsx(styles.viewport, className)}
      {...rest}
    >
      {mounted ? children : null}
    </div>
  );
};

type TimelineOverlayProps = React.ComponentProps<"div">;
const TimelineOverlay = ({
  children,
  className,
  style,
  ...rest
}: TimelineOverlayProps) => {
  const leftOffset = useTimelineStore((state) =>
    state.getViewport().getHeaderOffsetPx(),
  );

  return (
    <div
      className={clsx(styles.overlay, className)}
      style={React.useMemo(
        () => ({ left: leftOffset, ...style }),
        [leftOffset, style],
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const Timeline = {
  Root: TimelineRoot,
  Layers: TimelineLayers,
  Layer: TimelineLayer,
  Viewport: TimelineViewport,
  Overlay: TimelineOverlay,
};
