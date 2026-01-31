import { useSignal, useSignalSelector } from "@ptl/signal-react";
import { type SubtitleDocument, SubtitleParser } from "@ptl/subtitle-kit";
import { MinimapModule, PlayheadModule } from "@ptl/timeline-core";
import {
  Minimap,
  Panner,
  Playhead,
  Ruler,
  Timeline,
  Track,
  useTimeline,
  ViewportItem,
} from "@ptl/timeline-react";
import React from "react";

import styles from "./example.module.css";

export const Example3 = () => {
  const timeline = useTimeline();
  const minimapModule = MinimapModule.for(timeline);

  const [subtitle, setSubtitle] = React.useState<SubtitleDocument | null>(null);

  const isOverflow = useSignal(
    minimapModule.getStore().map(() => minimapModule.isOverflowing()),
  );
  const headerOffsetPx = useSignal(
    timeline
      .getViewport()
      .getStore()
      .map((s) => s.headerOffsetPx),
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === "string") {
          try {
            const doc = SubtitleParser.parse("srt", text);
            setSubtitle(doc);
            MinimapModule.for(timeline).setTotalRange(doc.getDuration());
            console.log(doc.getDuration() / (1000 * 60));
          } catch (error) {
            console.error("Failed to parse subtitle file:", error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const { index, currentText, progress } = useSignalSelector(
    ([{ position }]) => {
      if (!subtitle) return { currentText: "", progress: 0, index: -1 };
      const cue = subtitle.getAt(position)[0];
      return {
        index: cue?.index ?? -1,
        currentText: cue ? cue.text : "",
        progress:
          Math.round(
            (1 -
              (cue
                ? (cue.end.milliseconds - position) /
                  (cue.end.milliseconds - cue.start.milliseconds)
                : 0)) *
              100,
          ) / 100,
      };
    },
    [timeline.getModule(PlayheadModule).getStore()] as const,
  );

  return (
    <div className={styles.container}>
      <div className={styles.render}>
        <input type="file" accept=".srt,.vtt" onChange={onFileChange} />
        <pre
          dangerouslySetInnerHTML={{ __html: currentText }}
          className={styles.view}
          style={{
            background: `linear-gradient(to right, #e0e0e0 ${progress * 100}%, #ffffff ${progress * 100}%)`,
          }}
        />
        <div>
          <button
            onClick={() => {
              if (index <= 0 || !subtitle) return;
              const prevCue = subtitle.getCues()[index - 2];
              timeline
                .getModule(PlayheadModule)
                .setPosition(prevCue.start.milliseconds + 1);
            }}
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (!subtitle) return;
              const cues = subtitle.getCues();
              if (index >= cues.length - 1) return;
              const nextCue = cues[index];
              timeline
                .getModule(PlayheadModule)
                .setPosition(nextCue.start.milliseconds + 1);
            }}
          >
            Next
          </button>
          <button
            onClick={() => {
              const playhead = timeline.getModule(PlayheadModule);
              if (playhead.getStore().select((s) => s.isPlaying)) {
                playhead.pause();
              } else {
                playhead.play(1000 / 60);
              }
            }}
          >
            Play/Pause
          </button>
        </div>
      </div>
      <div className={styles.timelineContainer}>
        <Timeline.Root>
          <Timeline.Layers>
            <Timeline.Overlay style={{ overflow: "hidden" }}>
              <Playhead.Root>
                <Playhead.Head
                  style={{
                    left: -6,
                    width: 14,
                    height: 10,
                    backgroundColor: "red",
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  }}
                />
                <Playhead.Bar style={{ background: "red" }} />
                <Playhead.Handle />
              </Playhead.Root>
            </Timeline.Overlay>
            <Timeline.Viewport>
              <Ruler.Root className={styles.ruler}>
                <Ruler.Header className={styles.rulerHeader}>
                  Ruler
                </Ruler.Header>
                <Ruler.Ticks>
                  {({ unit, left, width }) => (
                    <div
                      className={styles.tickContainer}
                      style={{ width, left }}
                    >
                      <div className={styles.tickLabel}>
                        {new Date(unit).toISOString().substr(11, 8)}
                      </div>
                    </div>
                  )}
                </Ruler.Ticks>
              </Ruler.Root>
              <div style={{ height: 40 }}>
                <SubTitleTrack subtitle={subtitle} />
              </div>
            </Timeline.Viewport>
            <Timeline.Layer
              layer={0}
              className={styles.headersPlaceholder}
              style={{
                width: headerOffsetPx,
              }}
            />
          </Timeline.Layers>
          <div className={styles.footer}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 8,
              }}
            >
              <div className={styles.widgetContainer}>
                <Minimap.Root
                  style={{
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <Minimap.Thumb
                    style={{
                      border: "1px solid black",
                      background: "#c0c0c0",
                      borderRadius: 2,
                      minWidth: 30,
                    }}
                  >
                    {isOverflow && (
                      <Panner.Root
                        style={{
                          height: "100%",
                          width: "calc(100% - 20px)",
                          marginLeft: "10px",
                          position: "absolute",
                        }}
                        onPan={(delta) => {
                          timeline.panByPx(delta * 50);
                        }}
                      >
                        <Panner.Handle
                          style={{
                            height: "100%",
                            width: "5px",
                            background: "black",
                          }}
                        />
                      </Panner.Root>
                    )}
                    <Minimap.ResizeHandle
                      style={{
                        height: "100%",
                        width: "5px",
                        background: "#aaa",
                      }}
                      position="left"
                    />
                    <Minimap.ResizeHandle
                      style={{
                        height: "100%",
                        width: "5px",
                        background: "#aaa",
                      }}
                      position="right"
                    />
                  </Minimap.Thumb>
                </Minimap.Root>
              </div>
              <div className={styles.widgetContainer}>
                <ExamplePanner />
              </div>
            </div>
          </div>
        </Timeline.Root>
      </div>
    </div>
  );
};

const ExamplePanner = React.memo(() => {
  const timeline = useTimeline();
  return (
    <Panner.Root
      style={{
        width: "100%",
        height: "100%",
      }}
      onPan={(delta) => {
        timeline.panByPx(delta * 100);
      }}
    >
      <Panner.Handle
        style={{
          background: "#c0c0c0",
          border: "1px solid black",
          borderRadius: 2,
          height: "100%",
          width: 40,
        }}
      />
    </Panner.Root>
  );
});

ExamplePanner.displayName = "ExamplePanner";

const SubTitleTrack = React.memo(
  ({ subtitle }: { subtitle: SubtitleDocument | null }) => {
    const timeline = useTimeline();

    const visibleCues = useSignalSelector(
      ([current, visibleRange]) => {
        if (!subtitle) {
          return [];
        }

        return subtitle.getCues().filter((cue) => {
          return (
            cue.end.milliseconds >= current &&
            cue.start.milliseconds <= current + visibleRange
          );
        });
      },
      [
        timeline.getStore().map((s) => s.current),
        timeline
          .getViewport()
          .getStore()
          .map((s) => s.visibleRange),
      ] as const,
    );

    if (!subtitle) {
      return null;
    }

    return (
      <Track.Root height={40} className={styles.track}>
        <Track.Header className={styles.trackHeader}>
          Subtitle Track ({subtitle.getFormat().toUpperCase()})
        </Track.Header>
        <Track.Content>
          {visibleCues.map((cue) => (
            <ViewportItem
              key={cue.start.raw}
              start={cue.start.milliseconds}
              end={cue.end.milliseconds}
              className={styles.cue}
            >
              <span key={cue.text} className={styles.text}>
                {cue.text}
              </span>
            </ViewportItem>
          ))}
        </Track.Content>
      </Track.Root>
    );
  },
);

SubTitleTrack.displayName = "SubTitleTrack";
