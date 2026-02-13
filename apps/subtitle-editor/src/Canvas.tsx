import styles from "./App.module.css";
import { useSignalSelector } from "@ptl/signal-react";
import { useSubtitleEditor } from "./store.ts";
import * as ResizablePanels from "react-resizable-panels";
import { PANEL_MIN_SIZE } from "./App.tsx";
import { SubtitleParser } from "@ptl/subtitle-kit";
import * as React from "react";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";

export const Canvas = () => {
  const panelRef = ResizablePanels.usePanelRef();

  const ctx = useSubtitleEditor();
  const media = useSignalSelector(([state]) => state.media, [
    ctx.store,
  ] as const);
  const subtitles = useSignalSelector(([state]) => state.subtitles, [
    ctx.store,
  ] as const);

  const timeline = useTimeline();
  const playhead = PlayheadModule.for(timeline);

  React.useEffect(() => {
    return playhead.getStore().subscribe(({ position }) => {
      const video = ctx.getState().video;
      if (video) {
        video.currentTime = position / 1000;
      }
    });
  });

  const subtitleSources = React.useMemo(() => {
    if (!subtitles) return [];
    return subtitles.map(({ label, document }) => {
      return {
        label,
        src: URL.createObjectURL(
          new Blob([SubtitleParser.stringify("vtt", document)], {
            type: "text/plain",
          }),
        ),
      };
    });
  }, [subtitles]);

  return (
    <ResizablePanels.Panel
      panelRef={panelRef}
      minSize={PANEL_MIN_SIZE}
      className={styles.panel}
    >
      <div className={styles.canvas}>
        <div
          className={styles.canvasContent}
          style={
            {
              "--aspect-ratio": media ? media.metadata.aspectRatio : 21 / 9,
            } as React.CSSProperties
          }
        >
          <video
            ref={ctx.connectVideoElement}
            controls
            style={{
              height: "100%",
              width: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              playhead.setPosition(video.currentTime * 1000);
            }}
          >
            {media?.url && <source src={media.url} type="video/mp4" />}
            {subtitleSources?.map(({ label, src }) => (
              <track key={label} label={label} kind="subtitles" src={src} />
            ))}
          </video>
        </div>
      </div>
    </ResizablePanels.Panel>
  );
};
