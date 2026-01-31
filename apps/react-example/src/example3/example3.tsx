import { MinimapModule } from "@ptl/timeline-core";
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

  const tracks = React.useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: `track-${i}`,
      items: Array.from({ length: 10 }, (_, j) => ({
        id: `item-${i}-${j}`,
        start: j * 10000,
        end: j * 10000 + 10000,
        content: `Item ${j}`,
      })),
    }));
  }, []);

  const isOverflow = React.useSyncExternalStore(
    (callback) => timeline.subscribe(callback),
    () => timeline.getModule(MinimapModule).isOverflowing(),
    () => timeline.getModule(MinimapModule).isOverflowing(),
  );

  const headerOffsetPx = React.useSyncExternalStore(
    (callback) => timeline.subscribe(callback),
    () => timeline.getViewport().getHeaderOffsetPx(),
    () => timeline.getViewport().getHeaderOffsetPx(),
  );

  return (
    <div className={styles.container}>
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
                      <div className={styles.tickLabel}>{unit}</div>
                    </div>
                  )}
                </Ruler.Ticks>
              </Ruler.Root>
              <div>
                {tracks.map(({ id, items }) => (
                  <Track.Root
                    key={id}
                    height={40}
                    style={{ borderBottom: "1px solid #ccc" }}
                  >
                    <Track.Header
                      style={{
                        background: "#f0f0f0",
                        borderRight: "1px solid black",
                      }}
                    >
                      track-{id}
                    </Track.Header>
                    <Track.Content>
                      {items.map((item) => (
                        <ViewportItem
                          key={item.id}
                          start={item.start}
                          end={item.end}
                          style={{
                            background: "#ebcb87",
                            borderRadius: 2,
                            border: "solid #cba676",
                            borderWidth: "1px 0px",
                            boxShadow:
                              "inset 1px 0 0 rgba(255, 255, 255,0.3), inset -1px 0 0 rgba(0,0,0,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.content}
                        </ViewportItem>
                      ))}
                    </Track.Content>
                  </Track.Root>
                ))}
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
              </div>
            </div>
          </div>
        </Timeline.Root>
      </div>
    </div>
  );
};
