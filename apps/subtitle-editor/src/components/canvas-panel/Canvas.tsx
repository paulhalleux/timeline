import { useSignal } from "@ptl/signal-react";
import { type SubtitleDocument, SubtitleParser } from "@ptl/subtitle-kit";
import * as React from "react";

import { useMedia, useTracks, useVideoConnection } from "../../core";
import styles from "./Canvas.module.css";

const useSubtitleSources = () => {
  const tracks = useTracks();
  return React.useMemo(() => {
    return tracks.map(({ id, label, document }) => ({
      id,
      label,
      document,
    }));
  }, [tracks]);
};

export const Canvas: React.FC = () => {
  const media = useMedia();
  const subtitleSources = useSubtitleSources();

  const videoRef = useVideoConnection();

  const aspectRatio = media?.metadata.aspectRatio ?? 21 / 9;

  return (
    <div className={styles.canvas}>
      <div
        className={styles.canvasContent}
        style={{ "--aspect-ratio": aspectRatio } as React.CSSProperties}
      >
        <video ref={videoRef} controls className={styles.video}>
          {media?.url && <source src={media.url} type="video/mp4" />}
          {subtitleSources.map(({ id, label, document }) => (
            <SubtitleTrack key={id} id={id} label={label} document={document} />
          ))}
        </video>
      </div>
    </div>
  );
};

const SubtitleTrack: React.FC<{
  id: string;
  label: string;
  document: SubtitleDocument;
}> = ({ label, document }) => {
  const src = useSignal(
    document.getCuesSignal().map(() => {
      return URL.createObjectURL(
        new Blob([SubtitleParser.stringify(document.getFormat(), document)], {
          type: "text/plain",
        }),
      );
    }),
  );

  const prevSrcRef = React.useRef<string | null>(null);

  // eslint-disable-next-line react-hooks/refs
  if (prevSrcRef.current && prevSrcRef.current !== src) {
    // eslint-disable-next-line react-hooks/refs
    URL.revokeObjectURL(prevSrcRef.current);
    // eslint-disable-next-line react-hooks/refs
    prevSrcRef.current = src;
  }

  return <track key={src} label={label} kind="subtitles" src={src} />;
};
