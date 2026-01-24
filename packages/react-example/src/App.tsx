import React from "react";
import { Timeline } from "@ptl/timeline-core";
import {
  TimelineProvider,
  useTimeline,
  useViewport,
} from "@ptl/timeline-react";
import { getTickIntervalTime } from "./ruler.ts";

const InnerApp = () => {
  const timeline = useTimeline();
  const { zoom, viewportWidthPx, chunkWidthPx, translatePx } = useViewport();

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const factor = parseFloat(e.target.value);
    timeline.setZoom(factor, viewportWidthPx / 2);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    timeline.setCurrentPosition(value);
  };

  const [items] = React.useState(() => {
    return Array.from({ length: 50 }, (_, i) => i * 1000);
  });

  const [nowLine, setNowLine] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setNowLine((prev) => prev + 16);
      animationFrameId = requestAnimationFrame(animate);
    };

    if (playing) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [playing]);

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          border: "1px solid black",
          width: "100%",
        }}
      >
        <label style={{ marginLeft: 20 }}>
          Zoom:
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={handleZoomChange}
            style={{ width: 200, marginLeft: 10 }}
          />
          {zoom.toFixed(2)}×
        </label>
        <label style={{ marginLeft: 20 }}>
          Current Position:
          <input
            type="range"
            min={0}
            max={Math.max(...items)}
            step={1}
            value={timeline.getStore().select((s) => s.current)}
            onChange={handlePositionChange}
            style={{ width: 200, marginLeft: 10 }}
          />
        </label>
        <button
          onClick={() => setPlaying((prev) => !prev)}
          style={{ marginLeft: 20 }}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <div
        ref={timeline.connect.bind(timeline)}
        style={{
          width: "100%",
          overflow: "hidden",
          border: "1px solid #888",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: chunkWidthPx,
            height: "100%",
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: timeline.projectToChunk(nowLine) - translatePx,
              top: 0,
              width: 2,
              height: "100%",
              backgroundColor: "red",
            }}
          />
        </div>
        <div style={{ width: "100%", height: 28 }}>
          <div
            style={{
              position: "relative",
              width: chunkWidthPx,
              height: "40px",
              transform: `translateX(${-translatePx}px)`,
              background: "#f0f0f0",
              backgroundSize: "40px 40px",
            }}
          >
            <Ruler />
          </div>
        </div>
        <div
          style={{
            position: "relative",
            width: chunkWidthPx,
            height: "40px",
            transform: `translateX(${-translatePx}px)`,
            background:
              "linear-gradient(90deg, #e0e0e0 25%, #c0c0c0 25%, #c0c0c0 50%, #e0e0e0 50%, #e0e0e0 75%, #c0c0c0 75%, #c0c0c0 100%)",
            backgroundSize: "40px 40px",
          }}
        >
          {items.map((item, index) => {
            const x = timeline.projectToChunk(item);
            return (
              <div
                key={item}
                style={{
                  position: "absolute",
                  left: x,
                  top: 0,
                  width: timeline.unitToPx(1000),
                  height: "40px",
                  backgroundColor:
                    index % 2 === 0 ? "rgba(0,255,0,0.5)" : "rgba(0,0,255,0.5)",
                }}
              />
            );
          })}
        </div>
      </div>
      <TimelineMinimap items={items} nowLine={nowLine} />
    </div>
  );
};

export function App() {
  const [timeline] = React.useState(
    () =>
      new Timeline({
        minVisibleRange: 1000,
        maxVisibleRange: 20000,
        chunkSize: 3,
      }),
  );

  return (
    <TimelineProvider timeline={timeline}>
      <InnerApp />
    </TimelineProvider>
  );
}

const Ruler = () => {
  const timeline = useTimeline();
  const { chunkRange } = useViewport();

  const minTickIntervalPx = 100; // Minimum pixel distance between ticks
  const tickIntervalTime = getTickIntervalTime(
    timeline.unitToPx.bind(timeline),
    minTickIntervalPx,
  );

  const ticks: number[] = [];
  const chunkStart = timeline.getStore().select((s) => s.chunkStart);
  const chunkEnd = chunkStart + chunkRange;

  const firstTick = Math.ceil(chunkStart / tickIntervalTime) * tickIntervalTime;
  for (let t = firstTick; t < chunkEnd; t += tickIntervalTime) {
    ticks.push(t);
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 20,
        width: "100%",
        pointerEvents: "none",
        fontSize: 10,
      }}
    >
      {ticks.map((unit) => {
        const x = timeline.projectToChunk(unit);
        return (
          <div key={unit} style={{ position: "absolute", left: x }}>
            <div
              style={{
                width: 1,
                height: 10,
                background: "black",
              }}
            />
            <div style={{ position: "absolute", top: 10 }}>{unit}</div>
          </div>
        );
      })}
    </div>
  );
};

export const TimelineMinimap = ({
  items,
  nowLine,
}: {
  items: number[];
  nowLine: number;
}) => {
  const timeline = useTimeline();
  const { viewportWidthPx, visibleRange } = useViewport();

  const current = timeline.getStore().select((s) => s.current);
  const unitIn = 0;
  const unitOut = Math.max(...items) + 1000;
  const range = unitOut - unitIn;
  const visibleRatio = visibleRange / range;

  const [dragging, setDragging] = React.useState(false);
  const [initialClientX, setInitialClientX] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setInitialClientX(e.clientX);
  };

  React.useEffect(() => {
    const handleMouseUpGlobal = () => setDragging(false);
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (dragging) {
        const deltaPx = e.clientX - initialClientX;
        const deltaUnit = (deltaPx / viewportWidthPx) * (unitOut - unitIn);
        timeline.setCurrentPosition(
          Math.max(0, Math.min(current + deltaUnit, unitOut - visibleRange)),
        );
        setInitialClientX(e.clientX);
      }
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("mousemove", handleMouseMoveGlobal);

    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("mousemove", handleMouseMoveGlobal);
    };
  }, [
    current,
    dragging,
    initialClientX,
    timeline,
    unitOut,
    viewportWidthPx,
    visibleRange,
  ]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomChange = delta > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(
      1,
      Math.max(0, timeline.getZoomLevel() + zoomChange),
    );
    timeline.setZoom(newZoom, (e.clientX / viewportWidthPx) * viewportWidthPx);
  };

  return (
    <div
      onWheel={onWheel}
      style={{
        position: "relative",
        width: viewportWidthPx,
        height: 40,
        outline: "1px solid #888",
        background: "#f9f9f9",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: `${((current - unitIn) / range) * viewportWidthPx}px`,
          top: 0,
          height: "100%",
          width: `${visibleRatio * viewportWidthPx}px`,
          outline: "1px solid blue",
          boxSizing: "border-box",
          background: "rgba(0,0,255,0.1)",
          zIndex: 1,
        }}
      />
      {items.map((item, index) => {
        const x = ((item - unitIn) / range) * viewportWidthPx;
        return (
          <div
            key={item}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              width: range > 0 ? (1000 / range) * viewportWidthPx : 0,
              height: "100%",
              backgroundColor:
                index % 2 === 0 ? "rgba(255,0,0,0.1)" : "rgba(0,0,255,0.1)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: ((nowLine - unitIn) / range) * viewportWidthPx,
          top: 0,
          width: 2,
          height: "100%",
          backgroundColor: "red",
          zIndex: 2,
        }}
      />
    </div>
  );
};
