import { useStoreCombine } from "@ptl/store/react";
import {
  contentToPlainText,
  type Cue,
  getCueAt,
  type SubtitleDocument,
  time,
} from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import type { ColumnDef } from "@tanstack/react-table";
import clsx from "clsx";
import {
  ArrowRightIcon,
  ListIcon,
  PackageOpenIcon,
  TableIcon,
} from "lucide-react";
import React from "react";

import {
  useSubtitleDocument,
  useSubtitleEditor,
} from "../../../core/react.tsx";
import { formatTime } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { DataTable } from "../../ui/data-table";
import { EmptyState } from "../../ui/empty-state";
import { ListView } from "../../ui/list-view";
import { SearchInput } from "../../ui/search-input";
import { ToggleGroup } from "../../ui/toggle-group";
import { useAddNewCue } from "../../../core/actions/cue.ts";

type ViewMode = "list" | "table";

export const ContentExplorer = () => {
  const document = useSubtitleDocument((state) => state);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");

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
      <div className="shrink-0 p-2 border-b border-neutral-800 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search cues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            className="flex-1"
          />
          <ToggleGroup.Root
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <ToggleGroup.Item value="list" title="List view">
              <ListIcon size={14} />
            </ToggleGroup.Item>
            <ToggleGroup.Item value="table" title="Table view">
              <TableIcon size={14} />
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>
        <div className="text-xs text-neutral-500 text-right">
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

      {/* Content */}
      {viewMode === "list" ? (
        <CueList
          document={document}
          filteredCues={filteredCues}
          searchQuery={searchQuery}
        />
      ) : (
        <CueTable
          document={document}
          filteredCues={filteredCues}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

type CueListProps = {
  document: SubtitleDocument;
  filteredCues: readonly Cue[];
  searchQuery: string;
};

const CueList = ({ document, filteredCues, searchQuery }: CueListProps) => {
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
    <ListView.Root count={filteredCues.length} activeIndex={activeCueIndex}>
      <ListView.Items data={filteredCues} getItemKey={(cue) => cue.id}>
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

const cueTableColumns: ColumnDef<Cue, unknown>[] = [
  {
    id: "index",
    header: "#",
    size: 40,
    cell: ({ row }) => (
      <span className="font-mono text-neutral-500">{row.index + 1}</span>
    ),
  },
  {
    id: "start",
    header: "Start",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono">{formatTime(row.original.start.ms)}</span>
    ),
  },
  {
    id: "end",
    header: "End",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono">{formatTime(row.original.end.ms)}</span>
    ),
  },
  {
    id: "duration",
    header: "Duration",
    size: 100,
    cell: ({ row }) => {
      const durationMs = row.original.end.ms - row.original.start.ms;
      return (
        <span className="font-mono text-neutral-500">
          {formatTime(durationMs)}
        </span>
      );
    },
  },
  {
    id: "content",
    header: "Content",
    size: 400,
    cell: ({ row, table }) => {
      const searchQuery =
        (table.options.meta as { searchQuery?: string })?.searchQuery ?? "";
      return (
        <CueContentDisplay
          content={row.original.content}
          highlightQuery={searchQuery}
          className="text-ellipsis overflow-hidden whitespace-nowrap"
        />
      );
    },
  },
];

const CueTable = ({ document, filteredCues, searchQuery }: CueListProps) => {
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

  const handleRowClick = React.useCallback(
    (cue: Cue) => {
      playheadApi.setPosition(cue.start.ms);
    },
    [playheadApi],
  );

  const isRowActive = React.useCallback(
    (cue: Cue) => cue.id === activeCue?.id,
    [activeCue?.id],
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
    <DataTable
      data={filteredCues}
      columns={cueTableColumns}
      activeRowIndex={activeCueIndex}
      onRowClick={handleRowClick}
      isRowActive={isRowActive}
      rowHeight={40}
      meta={{ searchQuery }}
    />
  );
};
