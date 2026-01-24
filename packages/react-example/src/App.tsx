import React from "react";
import { Timeline, RulerModule, MinimapModule } from "@ptl/timeline-core";
import {
  TimelineProvider,
  useTimeline,
  useViewport,
} from "@ptl/timeline-react";
import { Ruler } from "./Ruler.tsx";
import { Minimap } from "./Minimap.tsx";

const InnerApp = () => {
  const timeline = useTimeline();
  const { zoom, chunkWidthPx, translatePx } = useViewport();

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const factor = parseFloat(e.target.value);
    timeline.setZoom(factor /*, viewportWidthPx / 2 */);
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
            <Ruler ruler={timeline.getModule(RulerModule)} />
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
          {items.map((item) => {
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
                  backgroundColor: "#08aaba",
                  border: "1px solid #06676b",
                  boxSizing: "border-box",
                  borderRadius: 2,
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
              />
            );
          })}
        </div>
      </div>
      <div style={{ border: "1px solid #888" }}>
        <Minimap minimap={timeline.getModule(MinimapModule)} />
      </div>
      <pre>{JSON.stringify(timeline.getStore().getState())}</pre>
    </div>
  );
};

export function App() {
  const [timeline] = React.useState(() => {
    const timeline = new Timeline({
      minVisibleRange: 1000,
      maxVisibleRange: 20000,
      chunkSize: 6,
    });

    timeline.registerModule(new RulerModule({ minTickIntervalPx: 50 }));
    timeline.registerModule(new MinimapModule(50000));

    return timeline;
  });

  return (
    <TimelineProvider timeline={timeline}>
      <InnerApp />
    </TimelineProvider>
  );
}
