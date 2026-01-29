import { clsx } from "clsx";
import React from "react";

import { useTimelineTranslate } from "../../timeline";
import styles from "./Playhead.module.css";
import { PlayheadProvider } from "./PlayheadProvider.tsx";
import { usePlayhead } from "./usePlayhead.ts";
import { usePlayheadHandle } from "./usePlayheadHandle.ts";

type PlayheadRootProps = React.ComponentProps<"div">;

const PlayheadRoot = ({
  style,
  className,
  children,
  ...rest
}: PlayheadRootProps) => {
  const [{ leftPx, position, playing }] = usePlayhead();
  const translatePx = useTimelineTranslate();
  return (
    <PlayheadProvider position={position} playing={playing}>
      <div
        className={clsx(styles.root, className)}
        style={React.useMemo(
          () => ({
            left: leftPx - translatePx,
            ...style,
          }),
          [leftPx, translatePx, style],
        )}
        {...rest}
      >
        {children}
      </div>
    </PlayheadProvider>
  );
};

type PlayheadBarProps = React.ComponentProps<"div">;
const PlayheadBar = ({ style, className, ...rest }: PlayheadBarProps) => {
  return (
    <div className={clsx(styles.bar, className)} style={style} {...rest} />
  );
};

type PlayheadHeadProps = React.ComponentProps<"div">;
const PlayheadHead = ({ style, className, ...rest }: PlayheadHeadProps) => {
  return (
    <div className={clsx(styles.head, className)} style={style} {...rest} />
  );
};

const PlayheadHandle = () => {
  const props = usePlayheadHandle();
  return <div className={styles.handle} {...props} />;
};

export const Playhead = {
  Root: PlayheadRoot,
  Bar: PlayheadBar,
  Head: PlayheadHead,
  Handle: PlayheadHandle,
};
