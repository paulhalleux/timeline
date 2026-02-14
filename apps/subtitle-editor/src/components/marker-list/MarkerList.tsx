import {
  BookmarkIcon,
  CircleDotIcon,
  FlagIcon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";

import {
  type MarkerType,
  type TimelineMarker,
  useCurrentTime,
  useEditor,
  useMarkers,
  useMarkerSelection,
} from "../../core";
import { formatTime } from "../../utils/format";
import { highlightText } from "../../utils/highlight.tsx";
import { Button, List, SearchBar } from "../ui";
import { EmptyState } from "../ui/EmptyState/EmptyState";
import styles from "./MarkerList.module.css";

// ============================================================================
// Marker Type Icons
// ============================================================================

const MARKER_ICONS: Record<MarkerType, React.ReactNode> = {
  bookmark: <BookmarkIcon size={14} />,
  chapter: <FlagIcon size={14} />,
  note: <MessageSquareIcon size={14} />,
  "sync-point": <CircleDotIcon size={14} />,
};

// ============================================================================
// MarkerListItem
// ============================================================================

interface MarkerListItemProps {
  marker: TimelineMarker;
  isSelected: boolean;
  isActive: boolean;
  searchQuery: string;
  onClick: (e: React.MouseEvent) => void;
}

const MarkerListItem: React.FC<MarkerListItemProps> = ({
  marker,
  isSelected,
  isActive,
  searchQuery,
  onClick,
}) => {
  return (
    <List.Item
      isActive={isActive}
      isSelected={isSelected}
      variant="row"
      onClick={onClick}
    >
      <List.Icon>{MARKER_ICONS[marker.type]}</List.Icon>
      <List.Meta>{formatTime(marker.time)}</List.Meta>
      <List.Text>
        {marker.label
          ? highlightText(marker.label, searchQuery, styles.highlight)
          : null}
      </List.Text>
    </List.Item>
  );
};

// ============================================================================
// MarkerList
// ============================================================================

export const MarkerList: React.FC = () => {
  const editor = useEditor();
  const markers = useMarkers();
  const selectedIds = useMarkerSelection();
  const currentTime = useCurrentTime();

  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter markers based on search query
  const filteredMarkers = React.useMemo(() => {
    if (!searchQuery.trim()) return markers;
    const query = searchQuery.toLowerCase();
    return markers.filter((marker) =>
      marker.label?.toLowerCase().includes(query),
    );
  }, [markers, searchQuery]);

  // Find the active marker (closest to current time)
  const activeMarkerId = React.useMemo(() => {
    if (filteredMarkers.length === 0) return null;

    // Find marker that is exactly at current time or the most recent one before
    const TOLERANCE = 250;
    for (let i = filteredMarkers.length - 1; i >= 0; i--) {
      const marker = filteredMarkers[i];
      if (Math.abs(marker.time - currentTime) < TOLERANCE) {
        return marker.id;
      }
    }
    return null;
  }, [filteredMarkers, currentTime]);

  const handleMarkerClick = React.useCallback(
    (marker: TimelineMarker, e: React.MouseEvent) => {
      const addToSelection = e.shiftKey || e.ctrlKey || e.metaKey;

      if (addToSelection) {
        editor.markers.toggleSelection(marker.id);
      } else {
        editor.markers.select(marker.id);
      }

      editor.playback.seek(marker.time);
    },
    [editor],
  );

  const handleDeleteSelected = React.useCallback(() => {
    editor.markers.removeSelected();
  }, [editor]);

  const hasSelection = selectedIds.size > 0;

  if (markers.length === 0) {
    return (
      <EmptyState
        icon={<BookmarkIcon size={48} />}
        title="No markers"
        description="Add markers using the toolbar or Shift+B/C/N/S shortcuts."
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${markers.length} markers...`}
        />
        {hasSelection && (
          <Button
            variant="default"
            size="md"
            onClick={handleDeleteSelected}
            title="Delete selected markers"
          >
            <Trash2Icon size={14} />
            <span>{selectedIds.size}</span>
          </Button>
        )}
      </div>

      {filteredMarkers.length === 0 && searchQuery ? (
        <EmptyState
          icon={<BookmarkIcon size={48} />}
          title="No matching markers"
          description={`No markers found for "${searchQuery}".`}
        />
      ) : (
        <List.Container>
          {filteredMarkers.map((marker) => {
            const isSelected = selectedIds.has(marker.id);
            const isActive = marker.id === activeMarkerId;

            return (
              <MarkerListItem
                key={marker.id}
                marker={marker}
                isSelected={isSelected}
                isActive={isActive}
                searchQuery={searchQuery}
                onClick={(e) => handleMarkerClick(marker, e)}
              />
            );
          })}
        </List.Container>
      )}
    </div>
  );
};
