import {
  contentToPlainText,
  type Cue,
  getCueAt,
  type SubtitleDocument,
} from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { ArrowRightIcon, PackageOpenIcon } from "lucide-react";
import React from "react";

import {
  useSubtitleDocument,
  useSubtitleEditor,
} from "../../../core/react.tsx";
import { formatTime } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { EmptyState } from "../../ui/empty-state";
import { SearchInput } from "../../ui/search-input";
import { useStoreCombine } from "@ptl/store/react";

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

  const timeline = useTimeline();
  const editor = useSubtitleEditor();

  const playheadApi = PlayheadModule.for(timeline);
  const activeCue = useStoreCombine(
    [playheadApi.getStore(), editor.store] as const,
    ([state]) => {
      return getCueAt(document, state.position + 1);
    },
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredCues.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  // Find the index of the active cue in the filtered list
  const activeCueIndex = React.useMemo(() => {
    if (!activeCue) return -1;
    return filteredCues.findIndex((c) => c.id === activeCue.id);
  }, [activeCue, filteredCues]);

  // Auto-scroll to the active cue
  const prevActiveCueIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (activeCueIndex < 0) return;
    // Only scroll when the active cue changes
    if (prevActiveCueIdRef.current === activeCue?.id) return;
    prevActiveCueIdRef.current = activeCue?.id ?? null;

    virtualizer.scrollToIndex(activeCueIndex, {
      align: "auto",
      behavior: "smooth",
    });
  }, [activeCueIndex, activeCue?.id, virtualizer]);

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
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const cue = filteredCues[virtualRow.index];
          return (
            <div
              key={cue.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <CueItem
                cue={cue}
                index={virtualRow.index}
                isActive={cue.id === activeCue?.id}
                searchQuery={searchQuery}
                onClick={handleCueClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

type CueItemProps = {
  cue: Cue;
  index: number;
  isActive: boolean;
  searchQuery: string;
  onClick: (cue: Cue) => void;
};

const CueItem = React.memo(
  ({ cue, index, isActive, searchQuery, onClick }: CueItemProps) => {
    return (
      <div
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
  },
);

CueItem.displayName = "CueItem";
