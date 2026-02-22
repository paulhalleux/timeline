import React from "react";

import clsx from "clsx";

type FlexProps<T extends React.ElementType = "div"> =
  React.ComponentPropsWithoutRef<T> & {
    as?: T;
    direction?: "row" | "col";
    justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
    align?: "start" | "center" | "end" | "stretch";
    wrap?: "wrap" | "nowrap" | "wrap-reverse";
    className?: string;
    children?: React.ReactNode;
  };

export const Flex = <T extends React.ElementType = "div">({
  as,
  direction = "row",
  justify = "start",
  align = "stretch",
  wrap = "nowrap",
  className,
  children,
  ...props
}: FlexProps<T>) => {
  const Component = as || "div";

  const classes = clsx(
    "flex",
    `flex-${direction}`,
    `justify-${justify}`,
    `items-${align}`,
    `flex-${wrap}`,
    className,
  );

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};
