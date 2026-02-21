import {
  contentToPlainText,
  type CueContent as CueContentType,
} from "@ptl/subtitle";
import clsx from "clsx";
import { CornerDownLeftIcon, CornerDownRightIcon } from "lucide-react";
import React from "react";

type HighlightRange = { start: number; end: number };

/**
 * Compute the character ranges within a plain-text representation of
 * CueContent[] that match the given search query (case-insensitive).
 */
export function computeHighlightRanges(
  content: readonly CueContentType[],
  query: string,
): HighlightRange[] {
  if (!query) return [];
  const plainText = contentToPlainText(content);
  const lowerText = plainText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const ranges: HighlightRange[] = [];
  let idx = 0;
  while ((idx = lowerText.indexOf(lowerQuery, idx)) !== -1) {
    ranges.push({ start: idx, end: idx + lowerQuery.length });
    idx += 1;
  }
  return ranges;
}

type CueContentDisplayProps = {
  content: readonly CueContentType[];
  /** Optional search query â€“ matched text will be highlighted. */
  highlightQuery?: string;
  className?: string;
};

/**
 * Renders CueContent[] with optional search-highlight support.
 * Renders line-break icons the same way the timeline items do.
 */
export const CueContentDisplay = React.memo(
  ({ content, highlightQuery, className }: CueContentDisplayProps) => {
    const ranges = React.useMemo(
      () => computeHighlightRanges(content, highlightQuery ?? ""),
      [content, highlightQuery],
    );

    // Precompute the character offset for each segment so we don't mutate during render
    const segmentOffsets = React.useMemo(() => {
      const offsets: number[] = [];
      let offset = 0;
      for (const segment of content) {
        offsets.push(offset);
        offset += segment.type === "break" ? 1 : segment.text.length;
      }
      return offsets;
    }, [content]);

    if (content.length === 0) {
      return (
        <span className={clsx("block italic opacity-50", className)}>
          (no content)
        </span>
      );
    }

    return (
      <span className={clsx("block", className)}>
        {content.map((segment, segIdx) => {
          if (segment.type === "break") {
            return (
              <React.Fragment key={segIdx}>
                <CornerDownLeftIcon
                  className="inline text-white/50 mx-0.5"
                  size={12}
                />
                <br />
                <CornerDownRightIcon
                  className="inline text-white/50 mx-0.5"
                  size={12}
                />
              </React.Fragment>
            );
          }

          const text = segment.text;
          const segStart = segmentOffsets[segIdx];

          if (ranges.length === 0) {
            return <React.Fragment key={segIdx}>{text}</React.Fragment>;
          }

          // Split this segment's text according to highlight ranges
          const parts: React.ReactNode[] = [];
          let cursor = 0;

          for (const range of ranges) {
            // Convert global range to local segment coordinates
            const localStart = Math.max(0, range.start - segStart);
            const localEnd = Math.min(text.length, range.end - segStart);

            // Skip ranges that don't overlap this segment
            if (localStart >= text.length || localEnd <= 0) continue;

            // Text before the highlight
            if (localStart > cursor) {
              parts.push(
                <React.Fragment key={`${segIdx}-${cursor}`}>
                  {text.slice(cursor, localStart)}
                </React.Fragment>,
              );
            }

            // Highlighted portion
            parts.push(
              <mark
                key={`${segIdx}-h-${localStart}`}
                className="bg-amber-500/40 text-inherit rounded-xs"
              >
                {text.slice(localStart, localEnd)}
              </mark>,
            );

            cursor = localEnd;
          }

          // Remaining text after last highlight
          if (cursor < text.length) {
            parts.push(
              <React.Fragment key={`${segIdx}-tail`}>
                {text.slice(cursor)}
              </React.Fragment>,
            );
          }

          return parts.length > 0 ? (
            <React.Fragment key={segIdx}>{parts}</React.Fragment>
          ) : (
            <React.Fragment key={segIdx}>{text}</React.Fragment>
          );
        })}
      </span>
    );
  },
);

CueContentDisplay.displayName = "CueContentDisplay";
