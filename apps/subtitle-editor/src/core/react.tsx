import { useSignal, useSignalSelector } from "@ptl/signal-react";
import {
  clamp,
  type EditorOptions,
  type EntityId,
  MarkerModule,
  type MarkerType,
  type PlaybackController,
  PlaybackModule,
  type PlaybackModuleState,
  SelectionModule,
  type SelectionModuleState,
  SubtitleEditor,
  type SubtitleTrack,
  type TimelineMarker,
  TrackModule,
} from "@ptl/subtitle-editor-core";
import { PlayheadModule, type TimelineApi } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import * as React from "react";

// ============================================================================
// Context
// ============================================================================

const EditorContext = React.createContext<SubtitleEditor | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface EditorProviderProps {
  options?: EditorOptions;
  children: React.ReactNode;
}

/**
 * Provider component for the subtitle editor.
 */
export const EditorProvider: React.FC<EditorProviderProps> = ({
  options,
  children,
}) => {
  const [editor] = React.useState(() => new SubtitleEditor(options));
  return (
    <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
  );
};

// ============================================================================
// Core Hook
// ============================================================================

/**
 * Hook to access the subtitle editor instance.
 * @throws Error if used outside of EditorProvider
 */
export const useEditor = (): SubtitleEditor => {
  const editor = React.useContext(EditorContext);
  if (!editor) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return editor;
};

// ============================================================================
// Track Hooks
// ============================================================================

/**
 * Hook to get all subtitle tracks with automatic re-rendering.
 */
export const useTracks = (): SubtitleTrack[] => {
  const editor = useEditor();
  const tracks = TrackModule.for(editor);
  return useSignalSelector(([state]) => state.tracks, [
    tracks.getStore(),
  ] as const);
};

/**
 * Hook to get a specific track.
 */
export const useTrack = (trackId: EntityId): SubtitleTrack | undefined => {
  const tracks = useTracks();
  return tracks.find((t) => t.id === trackId);
};

/**
 * Hook to get the active track.
 */
export const useActiveTrack = (): SubtitleTrack | undefined => {
  const editor = useEditor();
  const selection = SelectionModule.for(editor);
  const tracks = useTracks();
  const activeTrackId = useSignalSelector(([state]) => state.activeTrackId, [
    selection.getStore(),
  ] as const);
  return activeTrackId ? tracks.find((t) => t.id === activeTrackId) : undefined;
};

// ============================================================================
// Marker Hooks
// ============================================================================

/**
 * Hook to get all markers with automatic re-rendering.
 */
export const useMarkers = (): TimelineMarker[] => {
  const editor = useEditor();
  const markers = MarkerModule.for(editor);
  return useSignalSelector(([state]) => state.markers, [
    markers.getStore(),
  ] as const);
};

/**
 * Hook to get marker selection state.
 */
export const useMarkerSelection = (): Set<EntityId> => {
  const editor = useEditor();
  const markers = MarkerModule.for(editor);
  return useSignalSelector(([state]) => state.selectedMarkerIds, [
    markers.getStore(),
  ] as const);
};

/**
 * Hook to check if a marker is selected.
 */
export const useIsMarkerSelected = (markerId: EntityId): boolean => {
  const selectedIds = useMarkerSelection();
  return selectedIds.has(markerId);
};

/**
 * Hook to get markers of a specific type.
 */
export const useMarkersByType = (type: MarkerType): TimelineMarker[] => {
  const markers = useMarkers();
  return React.useMemo(
    () => markers.filter((m) => m.type === type),
    [markers, type],
  );
};

// ============================================================================
// Selection Hooks
// ============================================================================

/**
 * Hook to get selection state.
 */
export const useSelection = (): SelectionModuleState => {
  const editor = useEditor();
  const selection = SelectionModule.for(editor);
  return useSignal(selection.getStore());
};

/**
 * Hook to get the active track ID.
 */
export const useActiveTrackId = (): EntityId | null => {
  const editor = useEditor();
  const selection = SelectionModule.for(editor);
  return useSignalSelector(([state]) => state.activeTrackId, [
    selection.getStore(),
  ] as const);
};

/**
 * Hook to get selected cue indices for a track.
 */
export const useSelectedCues = (trackId: EntityId): Set<number> => {
  const editor = useEditor();
  const selection = SelectionModule.for(editor);
  return useSignalSelector(
    ([state]) => state.selectedCues.get(trackId) ?? new Set(),
    [selection.getStore()] as const,
  );
};

/**
 * Hook to check if a cue is selected.
 */
export const useIsCueSelected = (
  trackId: EntityId,
  cueIndex: number,
): boolean => {
  const selectedCues = useSelectedCues(trackId);
  return selectedCues.has(cueIndex);
};

// ============================================================================
// Playback Hooks
// ============================================================================

/**
 * Hook to get playback state.
 */
export const usePlayback = (): PlaybackModuleState => {
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  return useSignal(playback.getStore());
};

/**
 * Hook to get current playback time in milliseconds.
 */
export const useCurrentTime = (): number => {
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  return useSignalSelector(([state]) => state.currentTime, [
    playback.getStore(),
  ] as const);
};

/**
 * Hook to check if playing.
 */
export const useIsPlaying = (): boolean => {
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  return useSignalSelector(([state]) => state.isPlaying, [
    playback.getStore(),
  ] as const);
};

/**
 * Hook to get volume.
 */
export const useVolume = (): number => {
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  return useSignalSelector(([state]) => state.volume, [
    playback.getStore(),
  ] as const);
};

/**
 * Hook to check if muted.
 */
export const useIsMuted = (): boolean => {
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  return useSignalSelector(([state]) => state.isMuted, [
    playback.getStore(),
  ] as const);
};

// ============================================================================
// Media Hooks
// ============================================================================

/**
 * Hook to get loaded media.
 */
export const useMedia = () => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.media, [
    editor.getStore(),
  ] as const);
};

// ============================================================================
// Video Element Connection
// ============================================================================

/**
 * Creates a PlaybackController from a video element.
 */
export const createVideoController = (
  video: HTMLVideoElement,
  timeline: TimelineApi,
): PlaybackController => ({
  play: () => video.play(),
  pause: () => video.pause(),
  seek: (timeMs) => {
    const playhead = PlayheadModule.for(timeline);
    playhead.setPosition(timeMs);
    // video.currentTime = timeMs / 1000;
  },
  setVolume: (volume) => {
    video.volume = volume;
  },
  setMuted: (muted) => {
    video.muted = muted;
  },
  setPlaybackRate: (rate) => {
    video.playbackRate = rate;
  },
});

/**
 * Hook to connect a video element to the editor.
 */
export const useVideoConnection = () => {
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  const timeline = useTimeline();
  const playhead = PlayheadModule.for(timeline);

  const blockTimeUpdateEvent = React.useRef(false);
  const [videoRef, setVideoRef] = React.useState<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    return playhead.getStore().subscribe(({ position }) => {
      if (!videoRef) return;
      const normalizedPosition = Math.round(position);
      blockTimeUpdateEvent.current = true;
      if (!isNaN(videoRef.duration)) {
        videoRef.currentTime = clamp(
          normalizedPosition / 1000,
          0,
          videoRef.duration,
        );
      }
      playback.setCurrentTime(normalizedPosition);
    });
  }, [playback, playhead, videoRef]);

  React.useEffect(() => {
    if (!videoRef) return;

    const controller = createVideoController(videoRef, timeline);
    editor.connectPlaybackController(controller);

    // Event handlers
    const handleTimeUpdate = () => {
      if (blockTimeUpdateEvent.current) {
        blockTimeUpdateEvent.current = false;
        return;
      }
      playback.setCurrentTime(videoRef.currentTime * 1000);
      playhead.setPosition(videoRef.currentTime * 1000);
    };

    const handlePlay = () => {
      playback.setIsPlaying(true);
    };

    const handlePause = () => {
      playback.setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      playback.update({
        volume: videoRef.volume,
        isMuted: videoRef.muted,
      });
    };

    const handleDurationChange = () => {
      playback.setDuration(videoRef.duration * 1000);
    };

    const handleRateChange = () => {
      playback.update({
        playbackRate: videoRef.playbackRate,
      });
    };

    videoRef.addEventListener("timeupdate", handleTimeUpdate);
    videoRef.addEventListener("play", handlePlay);
    videoRef.addEventListener("pause", handlePause);
    videoRef.addEventListener("volumechange", handleVolumeChange);
    videoRef.addEventListener("durationchange", handleDurationChange);
    videoRef.addEventListener("ratechange", handleRateChange);

    return () => {
      videoRef.removeEventListener("timeupdate", handleTimeUpdate);
      videoRef.removeEventListener("play", handlePlay);
      videoRef.removeEventListener("pause", handlePause);
      videoRef.removeEventListener("volumechange", handleVolumeChange);
      videoRef.removeEventListener("durationchange", handleDurationChange);
      videoRef.removeEventListener("ratechange", handleRateChange);
      editor.disconnectPlaybackController();
    };
  }, [editor, playback, playhead, timeline, videoRef]);

  return (node: HTMLVideoElement | null) => {
    setVideoRef(node);
  };
};

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export interface KeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Seek amount in milliseconds */
  seekAmount?: number;
}

/**
 * Hook to setup keyboard shortcuts for the editor.
 */
export const useEditorKeyboardShortcuts = (
  options: KeyboardShortcutsOptions = {},
) => {
  const { enabled = true, seekAmount = 5000 } = options;
  const editor = useEditor();
  const playback = PlaybackModule.for(editor);
  const markers = MarkerModule.for(editor);
  const timeline = useTimeline();
  const playhead = PlayheadModule.for(timeline);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Playback controls
      if (e.code === "Space") {
        e.preventDefault();
        playback.togglePlayPause();
        return;
      }

      // Marker shortcuts (with Shift modifier)
      if (e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case "B":
            e.preventDefault();
            editor.addMarkerAtTime(playhead.getPosition(), "bookmark");
            return;
          case "C":
            e.preventDefault();
            editor.addMarkerAtTime(playhead.getPosition(), "chapter");
            return;
          case "N":
            e.preventDefault();
            editor.addMarkerAtTime(playhead.getPosition(), "note");
            return;
          case "S":
            e.preventDefault();
            editor.addMarkerAtTime(playhead.getPosition(), "sync-point");
            return;
        }
      }

      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          playback.seekBackward(seekAmount);
          break;
        case "ArrowRight":
          e.preventDefault();
          playback.seekForward(seekAmount);
          break;
        case "ArrowUp":
          if (e.shiftKey) {
            e.preventDefault();
            console.log("Go to previous cue");
            editor.goToPreviousCue();
          }
          break;
        case "ArrowDown":
          if (e.shiftKey) {
            e.preventDefault();
            editor.goToNextCue();
          }
          break;
        case "KeyM":
          e.preventDefault();
          playback.toggleMute();
          break;
        case "BracketLeft":
          e.preventDefault();
          editor.goToPreviousMarker();
          break;
        case "BracketRight":
          e.preventDefault();
          editor.goToNextMarker();
          break;
        case "Home":
          e.preventDefault();
          playback.seekToStart();
          break;
        case "End":
          e.preventDefault();
          playback.seekToEnd();
          break;
        case "Delete":
        case "Backspace":
          if (markers.getSelected().length > 0) {
            e.preventDefault();
            markers.removeSelected();
          }
          break;
        case "KeyW":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              editor.redo();
            } else {
              editor.undo();
            }
          }
          break;
        case "KeyY":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            editor.redo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, enabled, markers, playback, playhead, seekAmount]);
};
