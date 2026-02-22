import React from "react";

import { useStoreCombine } from "@ptl/store/react";
import { type Cue, getCueAt, type SubtitleDocument } from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";

import type { ColumnDef } from "@tanstack/react-table";

import { useSubtitleEditor } from "../../../core/react.tsx";
import { formatTime } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { DataTable } from "../../ui/data-table";
import { EmptyState } from "../../ui/empty-state";

const cueTableColumns: ColumnDef<Cue>[] = [
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

type CueTableProps = {
  document: SubtitleDocument;
  filteredCues: readonly Cue[];
  searchQuery: string;
};

export const CueTable = ({
  document,
  filteredCues,
  searchQuery,
}: CueTableProps) => {
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
