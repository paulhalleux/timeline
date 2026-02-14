import { SubtitleParser } from "@ptl/subtitle-kit";
import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";

import styles from "./App.module.css";
import { PANEL_MIN_SIZE } from "./App.tsx";
import { useMedia, useTracks, useVideoConnection } from "./core";

/**
 * Converts subtitle tracks to video track sources.
 */
const useSubtitleSources = () => {
  const tracks = useTracks();

  return React.useMemo(() => {
    return tracks.map(({ id, label, document }) => ({
      id,
      label,
      src: URL.createObjectURL(
        new Blob([SubtitleParser.stringify("vtt", document)], {
          type: "text/plain",
        }),
      ),
    }));
  }, [tracks]);
};

/**
 * Video canvas component with subtitle overlay.
 */
export const Canvas: React.FC = () => {
  const panelRef = ResizablePanels.usePanelRef();
  const videoRef = React.useRef<HTMLVideoElement>(null!);
  const media = useMedia();
  const subtitleSources = useSubtitleSources();

  // Connect video element to the editor's playback module
  useVideoConnection(videoRef);

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
          <video ref={videoRef} controls className={styles.video}>
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
