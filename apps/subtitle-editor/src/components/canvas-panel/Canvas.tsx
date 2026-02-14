import { SubtitleParser } from "@ptl/subtitle-kit";
import * as React from "react";

import { useMedia, useTracks, useVideoConnection } from "../../core";
import styles from "./Canvas.module.css";

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
  const videoRef = React.useRef<HTMLVideoElement>(null!);
  const media = useMedia();
  const subtitleSources = useSubtitleSources();

  // Connect video element to the editor's playback module
  useVideoConnection(videoRef);

  const aspectRatio = media?.metadata.aspectRatio ?? 21 / 9;

  return (
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
  );
};
