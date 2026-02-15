// React hooks and components
export * from "./react.tsx";

// Re-export types and modules from @ptl/subtitle-editor-core
export {
  type DragMode,
  DragModule,
  type DragModuleState,
  type DragResult,
  type DragSession,
  type DragTarget,
  type EditorOptions,
  type EntityId,
  // Modules for direct access
  HistoryModule,
  MarkerModule,
  type MarkerType,
  type PlaybackController,
  PlaybackModule,
  type PlaybackModuleState,
  SelectionModule,
  type SelectionModuleState,
  type SubtitleTrack,
  type TimelineMarker,
  TrackModule,
} from "@ptl/subtitle-editor-core";
