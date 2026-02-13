import type { SubtitleDocument } from "@ptl/subtitle-kit";

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
  metadata: VideoMetadata;
}

/**
 * Represents a single subtitle track with its associated document.
 */
export interface SubtitleTrack {
  id: string;
  label: string;
  document: SubtitleDocument;
}

/**
 * Main application state for the subtitle editor.
 */
export interface SubtitleEditorState {
  /** Reference to the video element for direct manipulation */
  video: HTMLVideoElement | null;
  /** Loaded media information */
  media: LoadedMedia | null;
  /** List of loaded subtitle tracks */
  subtitles: SubtitleTrack[];
}

/**
 * Initial state factory for creating a fresh editor state.
 */
export const createInitialState = (): SubtitleEditorState => ({
  video: null,
  media: null,
  subtitles: [],
});
