import React from "react";

import styles from "./TimeInput.module.css";

// ============================================================================
// Time Input Component
// ============================================================================

interface TimeInputProps {
  value: number; // milliseconds
  onChange: (ms: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  min = 0,
  max = Infinity,
}) => {
  const [inputValue, setInputValue] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Format milliseconds to HH:MM:SS.mmm
  const formatMs = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
  };

  // Parse time string to milliseconds
  const parseTime = (str: string): number | null => {
    // Try HH:MM:SS.mmm format
    const fullMatch = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/);
    if (fullMatch) {
      const [, h, m, s, ms] = fullMatch;
      return (
        parseInt(h) * 3600000 +
        parseInt(m) * 60000 +
        parseInt(s) * 1000 +
        parseInt(ms.padEnd(3, "0"))
      );
    }

    // Try MM:SS.mmm format
    const shortMatch = str.match(/^(\d{1,2}):(\d{2})\.(\d{1,3})$/);
    if (shortMatch) {
      const [, m, s, ms] = shortMatch;
      return (
        parseInt(m) * 60000 + parseInt(s) * 1000 + parseInt(ms.padEnd(3, "0"))
      );
    }

    // Try MM:SS format
    const simpleMatch = str.match(/^(\d{1,2}):(\d{2})$/);
    if (simpleMatch) {
      const [, m, s] = simpleMatch;
      return parseInt(m) * 60000 + parseInt(s) * 1000;
    }

    // Try seconds only
    const secondsMatch = str.match(/^(\d+(?:\.\d+)?)$/);
    if (secondsMatch) {
      return Math.round(parseFloat(secondsMatch[1]) * 1000);
    }

    return null;
  };

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(formatMs(value));
      setHasError(false);
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsEditing(false);
    onBlur?.();

    if (inputValue === formatMs(value)) {
      setHasError(false);
      return;
    }

    const parsed = parseTime(inputValue);
    if (parsed !== null && parsed >= min && parsed <= max) {
      onChange(parsed);
      setHasError(false);
    } else {
      setInputValue(formatMs(value));
      setHasError(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const parsed = parseTime(newValue);
    setHasError(parsed === null || parsed < min || parsed > max);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setInputValue(formatMs(value));
      setHasError(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      className={`${styles.timeInput} ${hasError ? styles.timeInputError : ""}`}
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};
