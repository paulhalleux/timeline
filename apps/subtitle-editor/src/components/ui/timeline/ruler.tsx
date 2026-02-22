import React from "react";

import { Ruler as BaseRuler } from "@ptl/timeline-react";

import clsx from "clsx";

export const RulerRoot = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseRuler.Root>) => {
  return (
    <BaseRuler.Root
      className={clsx(
        "h-10 border-b border-neutral-800 bg-neutral-900",
        "sticky top-0 z-10",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseRuler.Root>
  );
};

export const RulerHeader = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseRuler.Header>) => {
  return (
    <BaseRuler.Header
      className={clsx(
        "h-full border-r shrink-0 border-neutral-800 bg-neutral-900",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseRuler.Header>
  );
};

export const RulerTicks = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseRuler.Ticks>) => {
  return (
    <BaseRuler.Ticks className={clsx("h-full", className)} {...rest}>
      {children}
    </BaseRuler.Ticks>
  );
};

export const RulerTick = ({
  left,
  width,
  children,
  className,
}: React.PropsWithChildren<{
  left: number;
  width: number;
  className?: string;
}>) => {
  return (
    <div
      style={{ left, width }}
      className={clsx("absolute h-full border-r border-neutral-800", className)}
    >
      {children}
    </div>
  );
};
