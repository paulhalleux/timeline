import { useStoreSelector } from "@ptl/store/react";
import {
  Timeline as BaseTimeline,
  Track as BaseTrack,
  useTimeline,
  ViewportItem,
} from "@ptl/timeline-react";
import clsx from "clsx";
import React from "react";

export const TimelineRoot = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseTimeline.Root>) => {
  const timeline = useTimeline();
  const headerOffsetPx = useStoreSelector(timeline.getStore(), () => {
    return timeline.getViewport().getHeaderOffsetPx();
  });

  return (
    <BaseTimeline.Root className={clsx("h-full text-sm", className)} {...rest}>
      <BaseTimeline.Layers>
        {children}
        <BaseTimeline.Layer
          layer={0}
          className="border-r border-neutral-800 h-full"
          style={{
            width: headerOffsetPx,
          }}
        />
      </BaseTimeline.Layers>
    </BaseTimeline.Root>
  );
};

export const TimelineViewport = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseTimeline.Viewport>) => {
  return (
    <BaseTimeline.Viewport className={clsx("h-full", className)} {...rest}>
      {children}
    </BaseTimeline.Viewport>
  );
};

export const TimelineOverlay = ({
  children,
  className,
  style,
  ...rest
}: React.ComponentProps<typeof BaseTimeline.Overlay>) => {
  return (
    <BaseTimeline.Overlay
      className={clsx("h-full overflow-hidden", className)}
      style={style}
      {...rest}
    >
      {children}
    </BaseTimeline.Overlay>
  );
};

export const TimelineTrack = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseTrack.Root>) => {
  return (
    <BaseTrack.Root
      className={clsx("h-10 border-b border-neutral-800", className)}
      {...rest}
    >
      {children}
    </BaseTrack.Root>
  );
};

export const TimelineTrackHeader = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseTrack.Header>) => {
  return (
    <BaseTrack.Header
      className={clsx(
        "h-full border-r shrink-0 border-neutral-800 bg-neutral-900",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseTrack.Header>
  );
};

export const TimelineTrackContent = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseTrack.Content>) => {
  return (
    <BaseTrack.Content className={clsx("h-full", className)} {...rest}>
      {children}
    </BaseTrack.Content>
  );
};

export const TimelineTrackItem = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof ViewportItem>) => {
  return (
    <ViewportItem
      className={clsx(
        "overflow-hidden",
        "bg-cyan-900 rounded-xs border-r border-cyan-950 border-l border-l-white/10 border-t border-t-white/10",
        className,
      )}
      {...rest}
    >
      {children}
    </ViewportItem>
  );
};
