import React from "react";
import { Timeline } from "@ptl/timeline-core";
import {
  TimelineProvider,
  useTimeline,
  useTimelineStore,
  useViewport,
} from "@ptl/timeline-react";
import { Ruler, RulerHeader } from "./Ruler.tsx";
import { PlayheadModule, RulerModule } from "@ptl/timeline-core";
import { Playhead } from "./Playhead.tsx";
import { TimelineOverlay } from "./TimelineOverlay.tsx";
import { PanWidget } from "./PanWidget.tsx";

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
          }}
        >
          <TimelineOverlay>
            <Playhead />
          </TimelineOverlay>
          <div
            style={{
              height: "32px",
              borderBottom: "1px solid black",
              background: "#f0f0f0",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <RulerHeader />
            <Ruler />
          </div>
          <Viewport tracks={tracks} />
          <div
            style={{
              padding: "8px",
              borderTop: "1px solid black",
              background: "#f0f0f0",
              display: "flex",
            }}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              defaultValue="0"
              onChange={(e) => {
                const range = Number(e.target.value);
                timeline.setZoom(range);
              }}
              style={{ width: "100%" }}
            />
            <PanWidget
              onPan={(delta) => {
                timeline.panByPx(delta * 100);
              }}
            />
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
  const viewport = useViewport();

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
        height: "calc(100% - 72px)",
        overflowY: "auto",
        width: "100%",
        position: "relative",
      }}
    >
      {tracks.map((track, index, self) => (
        <div
          key={track.id}
          style={{
            borderBottom:
              index === self.length - 1 ? undefined : "1px solid gray",
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
              transform: `translateX(${-viewport.translatePx}px)`,
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
          background: "#4fabe4",
          borderRight: "1px solid #00000040",
          borderLeft: "1px solid #ffffff80",
          borderRadius: 2,
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
