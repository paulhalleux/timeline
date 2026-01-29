import React from "react";
import {
  MinimapModule,
  PlayheadModule,
  RulerModule,
  Timeline,
} from "@ptl/timeline-core";
import {
  Minimap,
  Panner,
  Ruler,
  TimelineProvider,
  useTimeline,
  useTimelineStore,
  useTimelineTranslate,
} from "@ptl/timeline-react";
import { Playhead } from "./Playhead.tsx";
import { TimelineOverlay } from "./TimelineOverlay.tsx";

export const Example3 = () => {
  const [timeline] = React.useState(() => {
    const timeline = new Timeline({
      minVisibleRange: 10000,
      maxVisibleRange: 100000,
      chunkSize: 10,
      headerOffsetPx: 300,
    });

    timeline.registerModule(new RulerModule());
    timeline.registerModule(new PlayheadModule());
    timeline.registerModule(
      new MinimapModule({
        initialTotalRange: 200000,
        computeTotalRange: (timeline) => {
          const current = timeline.getBounds().start;
          const overflow = 200000 - timeline.getVisibleRange();
          const range = 200000 + (current > overflow ? current - overflow : 0);
          return { range, overflow: Math.max(0, range - 200000) };
        },
      }),
    );

    return timeline;
  });

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

  return (
    <TimelineProvider timeline={timeline}>
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          userSelect: "none",
        }}
      >
        <div
          ref={(el) => timeline.connect(el)}
          style={{
            height: "50%",
            borderTop: "1px solid black",
            marginTop: "auto",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TimelineOverlay>
            <Playhead />
          </TimelineOverlay>
          <Ruler.Root
            style={{
              height: 40,
              borderBottom: "1px solid black",
              background: "#f0f0f0",
            }}
          >
            <Ruler.Header
              style={{
                background: "#f0f0f0",
              }}
            >
              Ruler
            </Ruler.Header>
            <Ruler.Ticks>
              {({ unit, left, width }) => (
                <div
                  style={{
                    position: "absolute",
                    width,
                    left,
                    height: "100%",
                    borderLeft: "1px solid black",
                    boxSizing: "border-box",
                    fontSize: 10,
                  }}
                >
                  <div
                    style={{
                      padding: "0px 4px 1px",
                      background: "black",
                      color: "white",
                      width: "max-content",
                    }}
                  >
                    {unit}
                  </div>
                </div>
              )}
            </Ruler.Ticks>
          </Ruler.Root>
          <Viewport tracks={tracks} />
          <div
            style={{
              padding: "8px",
              borderTop: "1px solid black",
              background: "#f0f0f0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: 2,
                  height: 24,
                  border: "1px solid black",
                  borderRadius: 4,
                  flexGrow: 1,
                }}
              >
                <Minimap.Root
                  style={{
                    height: "100%",
                    padding: 2,
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
              <div
                style={{
                  padding: 2,
                  height: 24,
                  border: "1px solid black",
                  borderRadius: 4,
                  width: 240,
                }}
              >
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
        </div>
      </div>
    </TimelineProvider>
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
          left: left + 1,
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
