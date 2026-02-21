import clsx from "clsx";
import React from "react";

type GridProps<T extends React.ElementType = "div"> =
  React.ComponentPropsWithoutRef<T> & {
    as?: T;
    cols?: number;
    gap?: number;
    rows?: number;
    autoFlow?: "row" | "column" | "dense";
    className?: string;
    children?: React.ReactNode;
  };

export const Grid = <T extends React.ElementType = "div">({
  as,
  cols,
  gap,
  rows,
  autoFlow,
  className,
  children,
  ...props
}: GridProps<T>) => {
  const Component = as || "div";

  const classes = clsx(
    "grid",
    cols && `grid-cols-${cols}`,
    rows && `grid-rows-${rows}`,
    gap && `gap-${gap}`,
    autoFlow && `grid-flow-${autoFlow}`,
    className,
  );

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};
