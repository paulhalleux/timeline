import clsx from "clsx";
import type { LucideProps } from "lucide-react";
import React from "react";

export type EmptyStateRootProps = React.ComponentPropsWithoutRef<"div">;

export const EmptyStateRoot = ({
  className,
  children,
  ...rest
}: EmptyStateRootProps) => {
  return (
    <div
      className={clsx(
        "flex h-full w-full flex-col items-center justify-center gap-2 p-8 text-center",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export type EmptyStateTitleProps = React.ComponentPropsWithoutRef<"h2">;

export const EmptyStateTitle = ({
  className,
  children,
  ...rest
}: EmptyStateTitleProps) => {
  return (
    <h2
      className={clsx("text-lg font-semibold text-neutral-200", className)}
      {...rest}
    >
      {children}
    </h2>
  );
};

export type EmptyStateDescriptionProps = React.ComponentPropsWithoutRef<"p">;

export const EmptyStateDescription = ({
  className,
  children,
  ...rest
}: EmptyStateDescriptionProps) => {
  return (
    <p className={clsx("text-sm text-neutral-500", className)} {...rest}>
      {children}
    </p>
  );
};

type EmptyStateIconProps = LucideProps & {
  icon: React.ComponentType<LucideProps>;
};

export const EmptyStateIcon = ({
  className,
  icon: Icon,
  ...rest
}: EmptyStateIconProps) => {
  return (
    <Icon size={48} className={clsx("text-neutral-500", className)} {...rest} />
  );
};

export const EmptyStateActions = ({
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<"div">) => {
  return (
    <div className={clsx("flex items-center gap-2", className)} {...rest}>
      {children}
    </div>
  );
};

export const EmptyStateAction = ({
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<"button">) => {
  return (
    <button
      className={clsx("underline text-sm text-neutral-300", className)}
      {...rest}
    >
      {children}
    </button>
  );
};
