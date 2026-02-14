import * as React from "react";
import {
  BookmarkIcon,
  CircleDotIcon,
  FlagIcon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react";

import {
  type MarkerType,
  type TimelineMarker,
  useCurrentTime,
  useEditor,
  useMarkers,
  useMarkerSelection,
} from "../../core";
import { formatTime } from "../../utils/format";
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
  itemRef?: React.Ref<HTMLButtonElement>;
}

const MarkerListItem: React.FC<MarkerListItemProps> = ({
  marker,
  isSelected,
  isActive,
  searchQuery,
  onClick,
  itemRef,
}) => {
  return (
    <List.Item
      isActive={isActive}
      isSelected={isSelected}
      variant="row"
      onClick={onClick}
      itemRef={itemRef}
    >
      <List.Icon>{MARKER_ICONS[marker.type]}</List.Icon>
      <List.Meta>{formatTime(marker.time)}</List.Meta>
      <List.Text>
        {marker.label ? (
          List.highlightText(marker.label, searchQuery)
        ) : (
          <span style={{ opacity: 0.5 }}>{marker.type}</span>
        )}
      </List.Text>
      <List.TypeBadge type={marker.type} />
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

  const listRef = React.useRef<HTMLDivElement>(null);
  const activeItemRef = React.useRef<HTMLButtonElement>(null);

  // Filter markers based on search query
  const filteredMarkers = React.useMemo(() => {
    if (!searchQuery.trim()) return markers;
    const query = searchQuery.toLowerCase();
    return markers.filter(
      (marker) =>
        marker.type.toLowerCase().includes(query) ||
        marker.label?.toLowerCase().includes(query),
    );
  }, [markers, searchQuery]);

  // Find the active marker (closest to current time)
  const activeMarkerId = React.useMemo(() => {
    if (filteredMarkers.length === 0) return null;

    // Find marker that is exactly at current time or the most recent one before
    const TOLERANCE = 500; // 500ms tolerance
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

      // Seek to marker time
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
            variant="ghost"
            size="sm"
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
        <List.Container ref={listRef}>
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
                itemRef={isActive ? activeItemRef : undefined}
              />
            );
          })}
        </List.Container>
      )}
    </div>
  );
};
