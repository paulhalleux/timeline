import { clsx } from "clsx";
import React from "react";

import { useTimelineStore } from "./useTimelineStore.ts";
import styles from "./ViewportItem.module.css";

type ViewportItemProps = React.ComponentProps<"div"> & {
  start: number;
  end: number;
};

export const ViewportItem = React.memo(
  ({ start, end, style, className, ...rest }: ViewportItemProps) => {
    const left = useTimelineStore((timeline) => timeline.projectToChunk(start));
    const width = useTimelineStore((timeline) =>
      timeline.unitToPx(end - start),
    );
    return (
      <div
        className={clsx(styles.item, className)}
        style={React.useMemo(
          () => ({
            left,
            width,
            ...style,
          }),
          [left, width, style],
        )}
        {...rest}
      />
    );
  },
);

ViewportItem.displayName = "ViewportItem";
