import React from "react";

import clsx from "clsx";

type ToolbarRootProps = React.ComponentPropsWithoutRef<"div">;

const ToolbarRoot = ({ className, children, ...rest }: ToolbarRootProps) => {
  return (
    <div
      role="toolbar"
      className={clsx(
        "flex items-center gap-1 px-1 h-8 shrink-0",
        "bg-neutral-900 border-b border-neutral-800",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

type ToolbarSectionProps = React.ComponentPropsWithoutRef<"div"> & {
  grow?: boolean;
  align?: "start" | "center" | "end";
};

const ToolbarSection = ({
  className,
  children,
  grow = false,
  align = "start",
  ...rest
}: ToolbarSectionProps) => {
  return (
    <div
      className={clsx(
        "flex items-center gap-1",
        { "flex-1": grow },
        {
          "justify-start": align === "start",
          "justify-center": align === "center",
          "justify-end": align === "end",
        },
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

type ToolbarSeparatorProps = React.ComponentPropsWithoutRef<"div">;

const ToolbarSeparator = ({ className, ...rest }: ToolbarSeparatorProps) => {
  return (
    <div
      role="separator"
      className={clsx("w-px h-4 bg-neutral-700 mx-0.5 shrink-0", className)}
      {...rest}
    />
  );
};

type ToolbarButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  active?: boolean;
  tooltip?: string;
};

const ToolbarButton = ({
  className,
  children,
  active = false,
  tooltip,
  ...rest
}: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      title={tooltip}
      className={clsx(
        "inline-flex items-center justify-center rounded-xs",
        "h-6 min-w-6 px-1 cursor-pointer transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        {
          "bg-neutral-700 text-neutral-100": active,
          "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800":
            !active,
        },
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

type ToolbarLabelProps = React.ComponentPropsWithoutRef<"span">;

const ToolbarLabel = ({ className, children, ...rest }: ToolbarLabelProps) => {
  return (
    <span
      className={clsx(
        "text-xs font-mono text-neutral-400 px-1 select-none",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

type ToolbarIconButtonProps = ToolbarButtonProps & {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  size?: number;
};

const ToolbarIconButton = ({
  icon: Icon,
  size = 14,
  children,
  ...rest
}: ToolbarIconButtonProps) => {
  return (
    <ToolbarButton {...rest}>
      <Icon size={size} />
      {children}
    </ToolbarButton>
  );
};

export const Toolbar = {
  Root: ToolbarRoot,
  Section: ToolbarSection,
  Separator: ToolbarSeparator,
  Button: ToolbarButton,
  IconButton: ToolbarIconButton,
  Label: ToolbarLabel,
};
