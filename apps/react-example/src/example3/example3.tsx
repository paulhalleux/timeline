import { MinimapModule } from "@ptl/timeline-core";
import {
  Minimap,
  Panner,
  Playhead,
  Ruler,
  Timeline,
  useDragPanning,
  useTimeline,
  useTimelineStore,
  useTimelineTranslate,
} from "@ptl/timeline-react";
import React from "react";

import styles from "./example.module.css";

export const Example3 = () => {
  const timeline = useTimeline();

  const tracks = React.useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `track-${i}`,
      items: Array.from({ length: 20 }, (_, j) => ({
        id: `item-${i}-${j}`,
        start: j * 10000,
        end: j * 10000 + 10000,
        content: `Item ${i}-${j}`,
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

  const dragPanning = useDragPanning<HTMLDivElement>();

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
            <Timeline.Viewport {...dragPanning}>
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

const Viewport = ({
  tracks,
}: {
  tracks: Array<{
    id: string;
    items: Array<{ id: string; start: number; end: number; content: string }>;
  }>;
}) => {
  const timeline = useTimeline();
  const translatePx = useTimelineTranslate();

  const [isDraggingViewport, setIsDraggingViewport] = React.useState(false);
  React.useEffect(() => {
    if (!isDraggingViewport) return;

    const handleMouseMove = (e: MouseEvent) => {
      timeline.panByPx(-e.movementX);
    };

    const handleMouseUp = () => {
      setIsDraggingViewport(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingViewport, timeline]);

  return (
    <div
      onMouseDown={() => setIsDraggingViewport(true)}
      style={{
        flex: "1",
        overflowY: "auto",
        width: "100%",
        position: "relative",
      }}
    >
      {tracks.map((track) => (
        <div
          key={track.id}
          style={{
            borderBottom: "1px solid #ccc",
            height: 40,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "300px",
              height: "100%",
              borderRight: "1px solid black",
              background: "#f0f0f0",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 15,
            }}
          >
            {track.id}
          </div>
          <div
            style={{
              position: "relative",
              flexGrow: 1,
              transform: `translateX(${-translatePx}px)`,
            }}
          >
            {track.items.map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Item = React.memo(
  ({
    item,
  }: {
    item: { id: string; start: number; end: number; content: string };
  }) => {
    const left = useTimelineStore((timeline) =>
      timeline.projectToChunk(item.start),
    );
    const width = useTimelineStore((timeline) =>
      timeline.unitToPx(item.end - item.start),
    );

    return (
      <div
        key={item.id}
        style={{
          position: "absolute",
          left: left,
          width: width,
          height: "100%",
          background: "white",
          borderWidth: "1px 1px 0px 0",
          outline: "1px solid black",
          outlineOffset: -2,
          borderRadius: 4,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.content}
      </div>
    );
  },
);
