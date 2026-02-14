// Core Editor
export {
  type EditorOptions,
  type EditorState,
  type PlaybackController,
  SubtitleEditor,
  type SubtitleEditorApi,
} from "./editor";

// Module types
export { type EditorModule, type EditorModuleClass } from "./editor-module";

// Modules
export {
  createCueDeleteAction,
  createCueInsertAction,
  createCueUpdateAction,
  createMarkerAddAction,
  createMarkerRemoveAction,
  type HistoryAction,
  HistoryModule,
  type HistoryModuleApi,
  type HistoryModuleOptions,
  type HistoryModuleState,
  MarkerModule,
  type MarkerModuleApi,
  type MarkerModuleState,
  PlaybackModule,
  type PlaybackModuleApi,
  type PlaybackModuleState,
  SelectionModule,
  type SelectionModuleApi,
  type SelectionModuleState,
  SnappingModule,
  type SnappingModuleApi,
  type SnappingModuleOptions,
  type SnappingModuleState,
  type SnapResult,
  TrackModule,
  type TrackModuleApi,
  type TrackModuleState,
} from "./modules";

// Types
export type {
  EditorEvent,
  EditorEventHandler,
  EditorEventType,
  EntityId,
  HistoryEntry,
  Identifiable,
  LoadedMedia,
  MarkerType,
  PlaybackState,
  SelectableEntityType,
  SelectionRef,
  SelectionState,
  SubtitleTrack,
  TimelineMarker,
  VideoMetadata,
} from "./types";

// Utilities
export { clamp, deepClone, generateId } from "./utils";
