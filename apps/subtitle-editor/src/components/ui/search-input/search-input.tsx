import clsx from "clsx";
import { SearchIcon, XIcon } from "lucide-react";
import React from "react";

type SearchInputProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "type"
> & {
  onClear?: () => void;
};

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...rest }, ref) => {
    return (
      <div className={clsx("relative flex items-center", className)}>
        <SearchIcon
          size={14}
          className="absolute left-2 text-neutral-500 pointer-events-none"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          className={clsx(
            "w-full rounded bg-neutral-800 border border-neutral-700 text-sm text-neutral-200",
            "placeholder:text-neutral-500 focus:outline-none focus:border-cyan-700",
            "pl-7 pr-7 py-1.5",
          )}
          {...rest}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
