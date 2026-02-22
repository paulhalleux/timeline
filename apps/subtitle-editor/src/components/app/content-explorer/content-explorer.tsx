import React from "react";

import { contentToPlainText } from "@ptl/subtitle";

import { ListIcon, PackageOpenIcon, TableIcon } from "lucide-react";

import { useSubtitleDocument } from "../../../core/react.tsx";
import { EmptyState } from "../../ui/empty-state";
import { SearchInput } from "../../ui/search-input";
import { ToggleGroup } from "../../ui/toggle-group";
import { CueList } from "./list-view.tsx";
import { CueTable } from "./table-view.tsx";

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
