import * as React from "react";
import styles from "./SearchBar.module.css";
import { SearchIcon, XIcon } from "lucide-react";

/* ============================================================================
 * SearchBar
 * ========================================================================== */

export interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class name */
  className?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Debounce delay in ms (0 = no debounce) */
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
  autoFocus = false,
  debounceMs = 0,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = React.useState(value);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal value with external value
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    } else {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <div className={`${styles.searchBar} ${className ?? ""}`}>
      <span className={styles.searchIcon}>
        <SearchIcon size={16} />
      </span>
      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />
      {internalValue && (
        <button
          type="button"
          className={styles.searchClear}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
};
