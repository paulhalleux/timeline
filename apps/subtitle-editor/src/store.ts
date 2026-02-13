import { Store } from "@ptl/store";
import * as React from "react";
import { SubtitleDocument, SubtitleParser } from "@ptl/subtitle-kit";
import { Timeline } from "@ptl/timeline-core";

type LoadedVideoMedia = {
  url: string;
  metadata: {
    duration: number;
    aspectRatio: number;
    width: number;
    height: number;
  };
};

type SubtitleTrack = {
  label: string;
  document: SubtitleDocument;
};

type SubtitleEditorState = {
  video?: HTMLVideoElement;
  media?: LoadedVideoMedia;
  subtitles?: SubtitleTrack[];
};

export const createSubtitleEditor = (timeline: Timeline) => {
  const store = new Store<SubtitleEditorState>({});

  const getState = () => store.get();

  const destroy = () => {
    const url = getState().media?.url;
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const loadVideo = (file: File) => {
    destroy();

    const video = document.createElement("video");
    video.preload = "metadata";

    const url = URL.createObjectURL(file);
    video.onloadedmetadata = function () {
      const duration = video.duration;
      store.set({
        ...getState(),
        media: {
          url: url,
          metadata: {
            duration,
            aspectRatio: video.videoWidth / video.videoHeight,
            width: video.videoWidth,
            height: video.videoHeight,
          },
        },
      });
    };
    video.src = url;
  };

  const loadSubtitles = (file: File) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target?.result;
      if (typeof text === "string") {
        const document = SubtitleParser.parse("vtt", text);
        store.set({
          ...getState(),
          subtitles: [
            ...(getState().subtitles || []),
            {
              label: file.name,
              document,
            },
          ],
        });
        timeline
          .getViewport()
          .setVisibleRange(document.getDuration() + document.getStartTime());
      }
    };
    reader.readAsText(file);
  };

  const connectVideoElement = (video: HTMLVideoElement | null) => {
    store.set({
      ...getState(),
      video: video || undefined,
    });
  };

  return {
    store,
    getState,
    loadVideo,
    loadSubtitles,
    destroy,
    connectVideoElement,
  };
};

type SubtitleEditorContextType = ReturnType<typeof createSubtitleEditor>;

export const SubtitleEditorContext = React.createContext<
  SubtitleEditorContextType | undefined
>(undefined);

export const useSubtitleEditor = () => {
  const context = React.useContext(SubtitleEditorContext);
  if (!context) {
    throw new Error(
      "useSubtitleEditor must be used within a SubtitleEditorProvider",
    );
  }
  return context;
};