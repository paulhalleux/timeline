import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";
import { useSignalSelector } from "@ptl/signal-react";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import { SubtitleParser } from "@ptl/subtitle-kit";
import { useSubtitleEditor } from "./store";
import { PANEL_MIN_SIZE } from "./App.tsx";
import styles from "./App.module.css";

/**
 * Converts subtitle tracks to video track sources.
 */
const useSubtitleSources = () => {
  const { store } = useSubtitleEditor();
  const subtitles = useSignalSelector(
    ([state]) => state.subtitles,
    [store] as const
  );

  return React.useMemo(() => {
    return subtitles.map(({ id, label, document }) => ({
      id,
      label,
      src: URL.createObjectURL(
        new Blob([SubtitleParser.stringify("vtt", document)], {
          type: "text/plain",
        })
      ),
    }));
  }, [subtitles]);
};

/**
 * Hook to sync video playback with timeline playhead.
 */
const usePlayheadSync = () => {
  const timeline = useTimeline();
  const { getState } = useSubtitleEditor();

  const playhead = React.useMemo(
    () => PlayheadModule.for(timeline),
    [timeline]
  );

  React.useEffect(() => {
    return playhead.getStore().subscribe(({ position }) => {
      const video = getState().video;
      if (video && !video.paused) {
        // Only sync when video is not playing to avoid feedback loops
        return;
      }
      if (video) {
        video.currentTime = position / 1000;
      }
    });
  }, [playhead, getState]);

  return playhead;
};

/**
 * Video canvas component with subtitle overlay.
 */
export const Canvas: React.FC = () => {
  const panelRef = ResizablePanels.usePanelRef();
  const { store, actions } = useSubtitleEditor();

  const media = useSignalSelector(([state]) => state.media, [store] as const);
  const subtitleSources = useSubtitleSources();
  const playhead = usePlayheadSync();

  const handleTimeUpdate = React.useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      playhead.setPosition(video.currentTime * 1000);
    },
    [playhead]
  );

  const aspectRatio = media?.metadata.aspectRatio ?? 21 / 9;

  return (
    <ResizablePanels.Panel
      panelRef={panelRef}
      minSize={PANEL_MIN_SIZE}
      className={styles.panel}
    >
      <div className={styles.canvas}>
        <div
          className={styles.canvasContent}
          style={{ "--aspect-ratio": aspectRatio } as React.CSSProperties}
        >
          <video
            ref={actions.connectVideoElement}
            controls
            className={styles.video}
            onTimeUpdate={handleTimeUpdate}
          >
            {media?.url && <source src={media.url} type="video/mp4" />}
            {subtitleSources.map(({ id, label, src }) => (
              <track key={id} label={label} kind="subtitles" src={src} />
            ))}
          </video>
        </div>
      </div>
    </ResizablePanels.Panel>
  );
};
