import { clsx } from "clsx";
import React from "react";

import { Translate, useTimelineStore } from "../timeline";
import styles from "./Track.module.css";

type TrackRootProps = React.ComponentProps<"div"> & {
  height: string | number;
};

const TrackRoot = ({
  children,
  height,
  style,
  className,
  ...rest
}: TrackRootProps) => {
  return (
    <div
      className={clsx(styles.root, className)}
      style={React.useMemo(
        () => ({
          height: height,
          ...style,
        }),
        [height, style],
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

type TrackHeaderProps = React.ComponentProps<"div">;
const TrackHeader = ({
  children,
  style,
  className,
  ...rest
}: TrackHeaderProps) => {
  const width = useTimelineStore((timeline) =>
    timeline.getViewport().getHeaderOffsetPx(),
  );

  return (
    <div
      className={clsx(styles.header, className)}
      style={React.useMemo(
        () => ({
          width,
          ...style,
        }),
        [style, width],
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

type TrackContentProps = React.ComponentProps<"div">;
const TrackContent = ({
  children,
  className,
  style,
  ...rest
}: TrackContentProps) => {
  const width = useTimelineStore((timeline) => timeline.getChunkWidthPx());
  return (
    <Translate
      className={clsx(styles.content, className)}
      style={React.useMemo(() => ({ width, ...style }), [style, width])}
      {...rest}
    >
      {children}
    </Translate>
  );
};

export const Track = {
  Root: TrackRoot,
  Header: TrackHeader,
  Content: TrackContent,
};
