import { Store } from "@ptl/store";
import { SubtitleParser } from "@ptl/subtitle-kit";
import type { Timeline } from "@ptl/timeline-core";
import {
  createInitialState,
  type SubtitleEditorState,
  type SubtitleTrack,
} from "../types";

/**
 * Generates a unique ID for subtitle tracks.
 */
const generateTrackId = (): string => {
  return `track_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Creates actions for manipulating subtitle editor state.
 */
export const createEditorActions = (
  store: Store<SubtitleEditorState>,
  timeline: Timeline,
) => {
  const getState = () => store.get();
  const setState = (partial: Partial<SubtitleEditorState>) => {
    store.set({ ...getState(), ...partial });
  };

  /**
   * Cleans up resources when loading new media or destroying.
   */
  const cleanup = () => {
    const { media } = getState();
    if (media?.url) {
      URL.revokeObjectURL(media.url);
    }
  };

  /**
   * Loads a video file and extracts its metadata.
   */
  const loadVideo = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      cleanup();

      const video = document.createElement("video");
      video.preload = "metadata";

      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        setState({
          media: {
            url,
            metadata: {
              duration: video.duration,
              aspectRatio: video.videoWidth / video.videoHeight,
              width: video.videoWidth,
              height: video.videoHeight,
            },
          },
        });
        resolve();
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video metadata"));
      };

      video.src = url;
    });
  };

  /**
   * Loads a subtitle file and adds it as a track.
   */
  const loadSubtitles = (file: File): Promise<SubtitleTrack> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") {
          reject(new Error("Failed to read subtitle file"));
          return;
        }

        try {
          const document = SubtitleParser.parse("vtt", text);
          const track: SubtitleTrack = {
            id: generateTrackId(),
            label: file.name,
            document,
          };

          const { subtitles } = getState();
          setState({ subtitles: [...subtitles, track] });

          // Adjust timeline viewport to fit subtitles
          const duration = document.getDuration() + document.getStartTime();
          timeline.getViewport().setVisibleRange(duration);

          resolve(track);
        } catch (error) {
          reject(new Error(`Failed to parse subtitle file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read subtitle file"));
      };

      reader.readAsText(file);
    });
  };

  /**
   * Removes a subtitle track by ID.
   */
  const removeSubtitleTrack = (trackId: string): void => {
    const { subtitles } = getState();
    setState({
      subtitles: subtitles.filter((track) => track.id !== trackId),
    });
  };

  /**
   * Connects a video element reference to the store.
   */
  const connectVideoElement = (video: HTMLVideoElement | null): void => {
    setState({ video });
  };

  /**
   * Destroys the editor and cleans up all resources.
   */
  const destroy = (): void => {
    cleanup();
    store.set(createInitialState());
  };

  return {
    loadVideo,
    loadSubtitles,
    removeSubtitleTrack,
    connectVideoElement,
    destroy,
  };
};

export type EditorActions = ReturnType<typeof createEditorActions>;
