import {
  contentToPlainText,
  type Cue,
  getCueAt,
  type SubtitleDocument,
} from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { usePlayhead, useTimeline } from "@ptl/timeline-react";
import clsx from "clsx";
import { ArrowRightIcon, PackageOpenIcon } from "lucide-react";
import React from "react";

import { useSubtitleDocument } from "../../../core/react.tsx";
import { formatTime } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { EmptyState } from "../../ui/empty-state";
import { SearchInput } from "../../ui/search-input";

export const ContentExplorer = () => {
  const document = useSubtitleDocument((state) => state);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCues = React.useMemo(() => {
    if (!document) return [];
    const cues = document.cues;

    if (!searchQuery) return cues;
    const lowerQuery = searchQuery.toLowerCase();
    return cues.filter((cue) => {
      const plainText = contentToPlainText(cue.content);
      return plainText.toLowerCase().includes(lowerQuery);
    });
  }, [document, searchQuery]);

  if (!document) {
    return (
      <EmptyState.Root>
        <EmptyState.Icon icon={PackageOpenIcon} />
        <EmptyState.Title>No document loaded</EmptyState.Title>
        <EmptyState.Description>
          Please load a subtitle document to see the content explorer.
        </EmptyState.Description>
      </EmptyState.Root>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 border-b border-neutral-800 flex flex-col items-end">
        <SearchInput
          placeholder="Search cues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          className="w-full"
        />
        <div className="text-xs text-neutral-500 mt-1.5">
          <span>
            {document.cues.length} cue{document.cues.length !== 1 ? "s" : ""}
          </span>
          {!!searchQuery && (
            <>
              <span className="mx-1">•</span>
              <span>
                {filteredCues.length} result
                {filteredCues.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Cue list */}
      <CueList
        document={document}
        filteredCues={filteredCues}
        searchQuery={searchQuery}
      />
    </div>
  );
};

type CueListProps = {
  document: SubtitleDocument;
  filteredCues: readonly Cue[];
  searchQuery: string;
};

const CueList = ({ document, filteredCues, searchQuery }: CueListProps) => {
  const listRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  const [{ position }] = usePlayhead();
  const timeline = useTimeline();
  const playheadApi = PlayheadModule.for(timeline);

  // Find the active cue (the one whose time range contains the playhead)
  const activeCue = React.useMemo(() => {
    return getCueAt(document, position + 1);
  }, [document, position]);

  // Auto-scroll to the active cue
  React.useEffect(() => {
    if (!activeCue) return;

    const el = itemRefs.current.get(activeCue.id);
    if (!el || !listRef.current) return;

    // Only scroll if the active cue is in the filtered list
    if (searchQuery) {
      const isInFiltered = filteredCues.some((c) => c.id === activeCue.id);
      if (!isInFiltered) return;
    }

    const container = listRef.current;
    const elTop = el.offsetTop - container.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Scroll only if the element is not visible
    if (elTop < scrollTop || elBottom > scrollTop + containerHeight) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeCue, filteredCues, searchQuery]);

  const handleCueClick = React.useCallback(
    (cue: Cue) => {
      playheadApi.setPosition(cue.start.ms);
    },
    [playheadApi],
  );

  if (filteredCues.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Description>
          {searchQuery
            ? `No cues match the search query "${searchQuery}".`
            : "No cues in the document."}
        </EmptyState.Description>
      </EmptyState.Root>
    );
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto">
      {filteredCues.map((cue, index) => (
        <CueItem
          key={cue.id}
          ref={(el) => {
            if (el) {
              itemRefs.current.set(cue.id, el);
            } else {
              itemRefs.current.delete(cue.id);
            }
          }}
          cue={cue}
          index={index}
          isActive={cue.id === activeCue?.id}
          searchQuery={searchQuery}
          onClick={handleCueClick}
        />
      ))}
    </div>
  );
};

type CueItemProps = {
  cue: Cue;
  index: number;
  isActive: boolean;
  searchQuery: string;
  onClick: (cue: Cue) => void;
  ref: React.Ref<HTMLDivElement>;
};

const CueItem = ({
  cue,
  index,
  isActive,
  searchQuery,
  onClick,
  ref,
}: CueItemProps) => {
  return (
    <div
      ref={ref}
      onClick={() => onClick(cue)}
      className={clsx(
        "flex flex-col gap-2 px-3 py-2 border-b border-neutral-800/60 cursor-pointer transition-colors",
        "hover:bg-neutral-800/50",
        isActive && "bg-cyan-950/40 border-l-2 border-l-cyan-800",
        !isActive && "border-l-2 border-l-transparent",
      )}
    >
      {/* Index & timing */}
      <div className="shrink-0 flex gap-3 min-w-11 text-neutral-300 text-xs font-mono">
        <span className="font-bold">#{index + 1}</span>
        <div
          className={clsx("flex items-center gap-1", {
            "text-cyan-100": isActive,
          })}
        >
          <span>{formatTime(cue.start.ms)}</span>
          <ArrowRightIcon size={10} />
          <span>{formatTime(cue.end.ms)}</span>
        </div>
      </div>

      <div
        className={clsx(
          "rounded-xs py-0.5 px-1.5",
          "bg-cyan-900 border border-white/15",
          "text-xs leading-relaxed",
        )}
      >
        <CueContentDisplay
          content={cue.content}
          highlightQuery={searchQuery}
          className="text-ellipsis overflow-hidden whitespace-nowrap"
        />
      </div>
    </div>
  );
};
