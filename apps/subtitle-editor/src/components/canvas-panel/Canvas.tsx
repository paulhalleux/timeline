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

  const { videoRef, setVideoRef } = useVideoConnection();

  const aspectRatio = media?.metadata.aspectRatio ?? 21 / 9;

  React.useEffect(() => {
    if (!subtitleSources[0]) return;
    if (videoRef?.textTracks[0]) videoRef.textTracks[0].mode = "showing";
    return subtitleSources[0].document.getCuesSignal().subscribe(() => {
      if (videoRef?.textTracks[0]) videoRef.textTracks[0].mode = "showing";
    });
  }, [subtitleSources, videoRef]);

  return (
    <div className={styles.canvas}>
      <div
        className={styles.canvasContent}
        style={{ "--aspect-ratio": aspectRatio } as React.CSSProperties}
      >
        <video ref={setVideoRef} className={styles.video}>
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

  if (prevSrcRef.current && prevSrcRef.current !== src) {
    URL.revokeObjectURL(prevSrcRef.current);

    prevSrcRef.current = src;
  }

  return <track key={src} label={label} kind="subtitles" src={src} />;
};
