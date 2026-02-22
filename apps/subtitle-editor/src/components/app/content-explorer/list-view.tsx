import React from "react";

import { useStoreCombine } from "@ptl/store/react";
import { type Cue, getCueAt, type SubtitleDocument, time } from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";

import clsx from "clsx";
import { ArrowRightIcon } from "lucide-react";

import { useAddNewCue } from "../../../core/actions/cue.ts";
import { useSubtitleEditor } from "../../../core/react.tsx";
import { formatTime } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { EmptyState } from "../../ui/empty-state";
import { ListView } from "../../ui/list-view";

type CueListProps = {
  document: SubtitleDocument;
  filteredCues: readonly Cue[];
  searchQuery: string;
};

export const CueList = ({
  document,
  filteredCues,
  searchQuery,
}: CueListProps) => {
  const timeline = useTimeline();
  const editor = useSubtitleEditor();

  const playheadApi = PlayheadModule.for(timeline);
  const activeCue = useStoreCombine(
    [playheadApi.getStore(), editor.store] as const,
    ([state]) => {
      return getCueAt(document, state.position + 1);
    },
  );

  const activeCueIndex = React.useMemo(() => {
    if (!activeCue) return -1;
    return filteredCues.findIndex((c) => c.id === activeCue.id);
  }, [activeCue, filteredCues]);

  const handleCueClick = React.useCallback(
    (cue: Cue) => {
      playheadApi.setPosition(cue.start.ms);
    },
    [playheadApi],
  );

  const handleAddNewCue = useAddNewCue();

  if (filteredCues.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Description>
          {searchQuery
            ? `No cues match the search query "${searchQuery}".`
            : "No cues in the document."}
        </EmptyState.Description>
        <EmptyState.Actions>
          <EmptyState.Action
            onClick={() => {
              handleAddNewCue({
                start: time(0),
                end: time(2000),
                content: [{ type: "text", text: "New cue" }],
              });
            }}
          >
            Add new
          </EmptyState.Action>
        </EmptyState.Actions>
      </EmptyState.Root>
    );
  }

  return (
    <ListView.Root
      count={filteredCues.length}
      activeIndex={activeCueIndex}
      getItemKey={(index) => filteredCues[index].id}
    >
      <ListView.Items data={filteredCues}>
        {(cue, index) => (
          <CueItem
            cue={cue}
            index={index}
            isActive={cue.id === activeCue?.id}
            searchQuery={searchQuery}
            onClick={handleCueClick}
          />
        )}
      </ListView.Items>
    </ListView.Root>
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
