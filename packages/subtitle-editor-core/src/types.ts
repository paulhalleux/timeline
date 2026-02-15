import type { SubtitleDocument } from "@ptl/subtitle-kit";

// ============================================================================
// Utility Types
// ============================================================================

export type EntityId = string;

export interface Identifiable {
  id: EntityId;
}

// ============================================================================
// Media Types
// ============================================================================

/**
 * Represents loaded video metadata extracted from the video element.
 */
export interface VideoMetadata {
  duration: number;
  aspectRatio: number;
  width: number;
  height: number;
}

/**
 * Represents a loaded video media with its URL and metadata.
 */
export interface LoadedMedia {
  url: string;
  filename: string;
  metadata: VideoMetadata;
}

// ============================================================================
// Subtitle Types
// ============================================================================

/**
 * Represents a single subtitle track with its associated document.
 */
export interface SubtitleTrack extends Identifiable {
  /** Display label (usually filename) */
  label: string;
  /** Parsed subtitle document */
  document: SubtitleDocument;
}

// ============================================================================
// Marker Types
// ============================================================================

/**
 * Marker types for timeline annotations.
 */
export type MarkerType = "bookmark" | "note";

/**
 * Represents a marker on the timeline.
 */
export interface TimelineMarker extends Identifiable {
  /** Time position in milliseconds */
  time: number;
  /** Marker type for visual differentiation */
  type: MarkerType;
  /** Optional label */
  label?: string;
  /** Optional color override */
  color?: string;
}

// ============================================================================
// Selection Types
// ============================================================================

/**
 * Types of entities that can be selected.
 */
export type SelectableEntityType = "track" | "cue" | "marker";

/**
 * Represents a selection reference.
 */
export interface SelectionRef {
  type: SelectableEntityType;
  id: EntityId;
  /** For cues, this is the track ID */
  parentId?: EntityId;
}

/**
 * Represents the current selection state.
 */
export interface SelectionState {
  /** Currently focused/active track ID (for tabs) */
  activeTrackId: EntityId | null;
  /** Set of selected entity references */
  selectedEntities: SelectionRef[];
}

// ============================================================================
// Playback Types
// ============================================================================

/**
 * Playback state for the video.
 */
export interface PlaybackState {
  /** Whether the video is currently playing */
  isPlaying: boolean;
  /** Current playback time in milliseconds */
  currentTime: number;
  /** Current volume (0-1) */
  volume: number;
  /** Whether the video is muted */
  isMuted: boolean;
  /** Playback rate (0.25 - 2.0) */
  playbackRate: number;
}

// ============================================================================
// History Types
// ============================================================================

/**
 * Represents a change that can be undone/redone.
 */
export interface HistoryEntry<T = unknown> {
  type: string;
  timestamp: number;
  data: T;
  undo: () => void;
  redo: () => void;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Editor event types.
 */
export type EditorEventType =
  | "track:added"
  | "track:removed"
  | "track:updated"
  | "marker:added"
  | "marker:removed"
  | "marker:updated"
  | "selection:changed"
  | "playback:changed"
  | "media:loaded"
  | "media:unloaded";

/**
 * Editor event payload.
 */
export interface EditorEvent<T = unknown> {
  type: EditorEventType;
  timestamp: number;
  data: T;
}

export type EditorEventHandler<T = unknown> = (event: EditorEvent<T>) => void;
