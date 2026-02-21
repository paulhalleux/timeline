import * as React from "react";

type PanelProps<T extends React.ElementType = "div"> =
  React.ComponentPropsWithoutRef<T> & {
    as?: T;
    children?: React.ReactNode;
  };

export const Panel = <T extends React.ElementType = "div">({
  as,
  children,
  ...props
}: PanelProps<T>) => {
  const Component = as || "div";

  return (
    <Component
      className="h-full w-full rounded bg-neutral-900 border border-neutral-800"
      {...props}
    >
      {children}
    </Component>
  );
};
