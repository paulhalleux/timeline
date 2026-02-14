import { useSignal, useSignalSelector } from "@ptl/signal-react";
import { PlayheadModule, type TimelineApi } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import * as React from "react";

import type { EditorOptions } from "./editor";
import { type PlaybackController, SubtitleEditor } from "./editor";
import type { PlaybackModuleState } from "./playback-module";
import type { SelectionModuleState } from "./selection-module";
import type {
  EntityId,
  MarkerType,
  SubtitleTrack,
  TimelineMarker,
} from "./types";
import { clamp } from "./utils.ts";

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

  React.useEffect(() => {
    return () => {
      editor.destroy();
    };
  }, [editor]);

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
  return useSignalSelector(([state]) => state.tracks, [
    editor.tracks.getStore(),
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
  const tracks = useTracks();
  const activeTrackId = useSignalSelector(([state]) => state.activeTrackId, [
    editor.selection.getStore(),
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
  return useSignalSelector(([state]) => state.markers, [
    editor.markers.getStore(),
  ] as const);
};

/**
 * Hook to get marker selection state.
 */
export const useMarkerSelection = (): Set<EntityId> => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.selectedMarkerIds, [
    editor.markers.getStore(),
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
  return useSignal(editor.selection.getStore());
};

/**
 * Hook to get the active track ID.
 */
export const useActiveTrackId = (): EntityId | null => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.activeTrackId, [
    editor.selection.getStore(),
  ] as const);
};

/**
 * Hook to get selected cue indices for a track.
 */
export const useSelectedCues = (trackId: EntityId): Set<number> => {
  const editor = useEditor();
  return useSignalSelector(
    ([state]) => state.selectedCues.get(trackId) ?? new Set(),
    [editor.selection.getStore()] as const,
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
  return useSignal(editor.playback.getStore());
};

/**
 * Hook to get current playback time in milliseconds.
 */
export const useCurrentTime = (): number => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.currentTime, [
    editor.playback.getStore(),
  ] as const);
};

/**
 * Hook to check if playing.
 */
export const useIsPlaying = (): boolean => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.isPlaying, [
    editor.playback.getStore(),
  ] as const);
};

/**
 * Hook to get volume.
 */
export const useVolume = (): number => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.volume, [
    editor.playback.getStore(),
  ] as const);
};

/**
 * Hook to check if muted.
 */
export const useIsMuted = (): boolean => {
  const editor = useEditor();
  return useSignalSelector(([state]) => state.isMuted, [
    editor.playback.getStore(),
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
      editor.playback.setCurrentTime(normalizedPosition);
    });
  }, [editor.playback, playhead, videoRef]);

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
      editor.playback.setCurrentTime(videoRef.currentTime * 1000);
      playhead.setPosition(videoRef.currentTime * 1000);
    };

    const handlePlay = () => {
      editor.playback.setIsPlaying(true);
    };

    const handlePause = () => {
      editor.playback.setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      editor.playback.update({
        volume: videoRef.volume,
        isMuted: videoRef.muted,
      });
    };

    const handleDurationChange = () => {
      editor.playback.setDuration(videoRef.duration * 1000);
    };

    const handleRateChange = () => {
      editor.playback.update({
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
  }, [editor, playhead, timeline, videoRef]);

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
        editor.playback.togglePlayPause();
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

      // Navigation and controls
      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          editor.playback.seekBackward(seekAmount);
          break;
        case "ArrowRight":
          e.preventDefault();
          editor.playback.seekForward(seekAmount);
          break;
        case "ArrowUp":
          if (e.shiftKey) {
            e.preventDefault();
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
          editor.playback.toggleMute();
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
          editor.playback.seekToStart();
          break;
        case "End":
          e.preventDefault();
          editor.playback.seekToEnd();
          break;
        case "Delete":
        case "Backspace":
          if (editor.markers.getSelected().length > 0) {
            e.preventDefault();
            editor.markers.removeSelected();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, enabled, playhead, seekAmount]);
};
