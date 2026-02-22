import React from "react";

import clsx from "clsx";

type ToggleGroupContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const ToggleGroupContext = React.createContext<ToggleGroupContextType | null>(
  null,
);

const useToggleGroup = () => {
  const ctx = React.useContext(ToggleGroupContext);
  if (!ctx) {
    throw new Error("ToggleGroup.Item must be used within a ToggleGroup.Root");
  }
  return ctx;
};

type ToggleGroupRootProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
};

const ToggleGroupRoot = ({
  value,
  onValueChange,
  className,
  children,
}: ToggleGroupRootProps) => {
  const ctx = React.useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange],
  );

  return (
    <ToggleGroupContext.Provider value={ctx}>
      <div
        role="group"
        className={clsx(
          "inline-flex items-center rounded bg-neutral-800 p-0.5 gap-0.5",
          className,
        )}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
};

type ToggleGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "type" | "onClick"
> & {
  value: string;
};

const ToggleGroupItem = ({
  value,
  className,
  children,
  ...rest
}: ToggleGroupItemProps) => {
  const { value: activeValue, onValueChange } = useToggleGroup();
  const isActive = value === activeValue;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={clsx(
        "inline-flex items-center justify-center rounded-xs p-1 cursor-pointer transition-colors",
        {
          ["bg-neutral-700 text-neutral-100"]: isActive,
          ["text-neutral-500 hover:text-neutral-300"]: !isActive,
        },
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export const ToggleGroup = {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
};
