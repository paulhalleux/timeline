import React, { useRef } from "react";
import { Timeline, RulerModule, MinimapModule } from "@ptl/timeline-core";
import {
  TimelineProvider,
  useMinimap,
  useRuler,
  useTimeline,
  useViewport,
} from "@ptl/timeline-react";

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
      <div style={{ border: "1px solid #888" }}>
        <Minimap minimap={timeline.getModule(MinimapModule)} />
      </div>
    </div>
  );
};

export function App() {
  const [timeline] = React.useState(() => {
    const timeline = new Timeline({
      minVisibleRange: 1000,
      maxVisibleRange: 20000,
      chunkSize: 3,
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

const Ruler = ({ ruler }: { ruler: RulerModule }) => {
  const timeline = useTimeline();
  const { ticks } = useRuler(ruler);

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

const Minimap = ({ minimap }: { minimap: MinimapModule }) => {
  const timeline = useTimeline();
  const state = useMinimap(minimap);
  const { viewportWidthPx } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = React.useState(false);
  const [clientX, setClientX] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setClientX(e.clientX);
  };

  React.useEffect(() => {
    const handleMouseUpGlobal = () => setDragging(false);
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!dragging) {
        return;
      }

      const deltaX = e.clientX - clientX;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const positionRatio =
        (state.visibleStartRatio * rect.width + deltaX) / rect.width;

      minimap.setVisibleStartRatio(
        Math.max(0, Math.min(1 - state.visibleSizeRatio, positionRatio)),
      );

      setClientX(e.clientX);
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("mousemove", handleMouseMoveGlobal);

    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("mousemove", handleMouseMoveGlobal);
    };
  }, [
    clientX,
    dragging,
    minimap,
    state.visibleSizeRatio,
    state.visibleStartRatio,
    timeline,
    viewportWidthPx,
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
      ref={containerRef}
      onWheel={onWheel}
      style={{
        position: "relative",
        height: 16,
        background: "#222",
        cursor: "pointer",
      }}
    >
      {/* visible window */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: `${Math.min(1 - state.visibleSizeRatio, state.visibleStartRatio) * 100}%`,
          width: `${state.visibleSizeRatio * 100}%`,
          top: 0,
          bottom: 0,
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      />
    </div>
  );
};
