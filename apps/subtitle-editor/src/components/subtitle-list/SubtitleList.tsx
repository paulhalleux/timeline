import { useSignalSelector } from "@ptl/signal-react";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import { ArrowDownIcon, CaptionsIcon } from "lucide-react";
import * as React from "react";

import {
  type SubtitleTrack,
  useActiveTrack,
  useActiveTrackId,
  useEditor,
  useTracks,
} from "../../core";
import { formatTime } from "../../utils/format.ts";
import { Button, SearchBar, Tabs } from "../ui";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import styles from "./SubtitleList.module.css";

/* ============================================================================
 * CueListItem
 * ========================================================================== */

interface CueListItemProps {
  start: number;
  end: number;
  text: string;
  searchQuery: string;
  isActive: boolean;
  onClick: () => void;
  itemRef?: React.Ref<HTMLButtonElement>;
}

const CueListItem: React.FC<CueListItemProps> = ({
  start,
  end,
  text,
  searchQuery,
  isActive,
  onClick,
  itemRef,
}) => {
  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <button
      ref={itemRef}
      className={`${styles.cueItem} ${isActive ? styles.cueItemActive : ""}`}
      onClick={onClick}
    >
      <span className={styles.cueTime}>
        {formatTime(start)} → {formatTime(end)}
      </span>
      <span className={styles.cueText}>{highlightText(text, searchQuery)}</span>
    </button>
  );
};

/* ============================================================================
 * SubtitleTrackContent
 * ========================================================================== */

interface SubtitleTrackContentProps {
  track: SubtitleTrack;
  searchQuery: string;
  autoScroll: boolean;
}

const SubtitleTrackContent: React.FC<SubtitleTrackContentProps> = ({
  track,
  searchQuery,
  autoScroll,
}) => {
  const timeline = useTimeline();
  const playhead = React.useMemo(
    () => PlayheadModule.for(timeline),
    [timeline],
  );
  const listRef = React.useRef<HTMLDivElement>(null);
  const activeItemRef = React.useRef<HTMLButtonElement>(null);
  const lastActiveIndexRef = React.useRef<number>(-1);

  const position = useSignalSelector(([state]) => state.position, [
    playhead.getStore(),
  ] as const);

  const cues = track.document.getCues();

  // Filter cues based on search query
  const filteredCues = React.useMemo(() => {
    if (!searchQuery.trim()) return cues;
    const query = searchQuery.toLowerCase();
    return cues.filter((cue) => cue.text.toLowerCase().includes(query));
  }, [cues, searchQuery]);

  // Find active cue index
  const activeCueIndex = React.useMemo(() => {
    return filteredCues.findIndex(
      (cue) =>
        position >= cue.start.milliseconds && position < cue.end.milliseconds,
    );
  }, [filteredCues, position]);

  // Auto-scroll to active cue when it changes
  React.useEffect(() => {
    if (
      autoScroll &&
      !searchQuery &&
      activeCueIndex !== -1 &&
      activeCueIndex !== lastActiveIndexRef.current &&
      activeItemRef.current &&
      listRef.current
    ) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    lastActiveIndexRef.current = activeCueIndex;
  }, [activeCueIndex, autoScroll, searchQuery]);

  const handleCueClick = React.useCallback(
    (startMs: number) => {
      playhead.setPosition(startMs);
    },
    [playhead],
  );

  if (filteredCues.length === 0 && searchQuery) {
    return (
      <EmptyState
        icon={<CaptionsIcon size={48} />}
        title="No matching cues"
        description={`No cues found for "${searchQuery}". Try a different search term?`}
      />
    );
  }

  return (
    <div ref={listRef} className={styles.cueList}>
      {filteredCues.map((cue, index) => {
        const startMs = cue.start.milliseconds;
        const endMs = cue.end.milliseconds;
        const isActive = index === activeCueIndex;

        return (
          <CueListItem
            key={`${track.id}-${index}`}
            itemRef={isActive ? activeItemRef : undefined}
            start={startMs}
            end={endMs}
            text={cue.text}
            searchQuery={searchQuery}
            isActive={isActive}
            onClick={() => handleCueClick(startMs)}
          />
        );
      })}
    </div>
  );
};

/* ============================================================================
 * SubtitleList
 * ========================================================================== */

export const SubtitleList: React.FC = () => {
  const editor = useEditor();
  const tracks = useTracks();
  const activeTrack = useActiveTrack();
  const activeTrackId = useActiveTrackId();

  // Local UI state (not in core editor)
  const [searchQuery, setSearchQuery] = React.useState("");
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);

  // Clear search when switching tabs
  const handleTabChange = React.useCallback(
    (tabId: string) => {
      editor.selection.setActiveTrack(tabId);
      setSearchQuery("");
    },
    [editor],
  );

  const handleToggleAutoScroll = React.useCallback(() => {
    setAutoScrollEnabled((prev) => !prev);
  }, []);

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={<CaptionsIcon size={48} />}
        title="No subtitle tracks"
        description="Add a subtitle track to get started."
      />
    );
  }

  const handleCloseTab = (trackId: string) => {
    editor.removeTrack(trackId);
  };

  const cueCount = activeTrack?.document.getCues().length ?? 0;

  return (
    <div className={styles.container}>
      <Tabs.Root value={activeTrackId ?? ""} onValueChange={handleTabChange}>
        <Tabs.List>
          {tracks.map((track) => (
            <Tabs.Trigger
              key={track.id}
              value={track.id}
              icon={<CaptionsIcon size={14} />}
              onClose={() => handleCloseTab(track.id)}
            >
              {track.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className={styles.toolbar}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${cueCount} cues...`}
          />
          <Button
            variant="icon"
            active={autoScrollEnabled}
            onClick={handleToggleAutoScroll}
            title={
              autoScrollEnabled ? "Auto-scroll enabled" : "Auto-scroll disabled"
            }
            aria-pressed={autoScrollEnabled}
          >
            <ArrowDownIcon size={16} />
          </Button>
        </div>
        {tracks.map((track) => (
          <Tabs.Content key={track.id} value={track.id}>
            <SubtitleTrackContent
              track={track}
              searchQuery={searchQuery}
              autoScroll={autoScrollEnabled}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
};
