import * as React from "react";

/**
 * Highlights occurrences of the query within the given text.
 *
 * @param text - The text to search within.
 * @param query - The search query to highlight.
 * @param highlightClass - Optional CSS class for styling the highlighted text.
 * @returns A React node with the highlighted text.
 */
export const highlightText = (
  text: string,
  query: string,
  highlightClass: string,
): React.ReactNode => {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className={highlightClass}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
};
