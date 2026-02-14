// Core Editor
export {
  type EditorOptions,
  type EditorState,
  type PlaybackController,
  SubtitleEditor,
} from "./editor";

// Modules
export { MarkerModule, type MarkerModuleState } from "./marker-module";
export { PlaybackModule, type PlaybackModuleState } from "./playback-module";
export { SelectionModule, type SelectionModuleState } from "./selection-module";
export { TrackModule, type TrackModuleState } from "./track-module";

// React Integration
export {
  // Video connection
  createVideoController,
  EditorProvider,
  type EditorProviderProps,
  type KeyboardShortcutsOptions,
  useActiveTrack,
  useActiveTrackId,
  useCurrentTime,
  useEditor,
  // Keyboard shortcuts
  useEditorKeyboardShortcuts,
  useIsCueSelected,
  useIsMarkerSelected,
  useIsMuted,
  useIsPlaying,
  // Markers
  useMarkers,
  useMarkersByType,
  useMarkerSelection,
  // Media
  useMedia,
  // Playback
  usePlayback,
  useSelectedCues,
  // Selection
  useSelection,
  useTrack,
  // Tracks
  useTracks,
  useVideoConnection,
  useVolume,
} from "./react";

// Types
export type {
  EditorEvent,
  EditorEventHandler,
  // Events
  EditorEventType,
  // Utility types
  EntityId,
  // History
  HistoryEntry,
  Identifiable,
  LoadedMedia,
  // Markers
  MarkerType,
  // Playback
  PlaybackState,
  // Selection
  SelectableEntityType,
  SelectionRef,
  SelectionState,
  // Subtitles
  SubtitleTrack,
  TimelineMarker,
  // Media
  VideoMetadata,
} from "./types";

// Utilities
export { clamp, deepClone, generateId } from "./utils";
