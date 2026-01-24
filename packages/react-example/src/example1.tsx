import React, { useState, useSyncExternalStore } from "react";
import { Timeline } from "@ptl/timeline-core";

const useTimelineChunkTranslate = (timeline: Timeline) => {
  return useSyncExternalStore(
    (onStoreChange) => timeline.getStore().subscribe(onStoreChange),
    () => {
      return timeline.getTranslatePx();
    },
    () => 0,
  );
};

export function App() {
  const [timeline] = useState(
    () =>
      new Timeline({
        minVisibleRange: 100,
        maxVisibleRange: 2000,
        chunkSize: 3,
      }),
  );

  const chunkTranslate = useTimelineChunkTranslate(timeline);
  const [items] = useState(() => {
    return Array.from({ length: 50 }, (_, i) => i * 100);
  });

  // reactive state for sliders
  const [position, setPosition] = useState(
    timeline.getStore().select((s) => s.current),
  );
  const [zoom, setZoom] = useState(0);
  const [now, setNow] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    if (!isPlaying) return;
    let animationFrameId: number;

    const step = () => {
      setNow((prev) => {
        const newNow = prev + 16.67;
        // if now is more than current + visibleRange, set current to current + visibleRange
        const visibleRange = timeline
          .getViewport()
          .getStore()
          .select((s) => s.visibleRange);
        const current = timeline.getStore().select((s) => s.current);
        if (newNow > current + visibleRange) {
          timeline.setCurrentPosition(current + visibleRange);
          setPosition(current + visibleRange);
        }
        return newNow;
      });
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, timeline]);

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPosition(value);
    timeline.setCurrentPosition(value);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const factor = parseFloat(e.target.value);
    setZoom(factor);
    timeline.setZoom(
      factor,
      timeline
        .getViewport()
        .getStore()
        .select((s) => s.widthPx) / 2,
    );
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 20 }}>
          Position:
          <input
            type="range"
            min={0}
            max={10000}
            step={1}
            value={position}
            onChange={handlePositionChange}
            style={{ width: 300, marginLeft: 10 }}
          />
          {position.toFixed(0)}
        </label>

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
        <button onClick={() => setIsPlaying((p) => !p)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div
        ref={timeline.connect.bind(timeline)}
        style={{
          width: "100%",
          height: "100px",
          overflow: "hidden",
          border: "1px solid #888",
          position: "relative",
        }}
      >
        {/* Chunk */}
        <div
          style={{
            position: "absolute",
            left: `${-chunkTranslate}px`,
            top: 0,
            height: "100%",
            width: timeline.getChunkWidthPx(),
            background: "#f0f0f0",
            border: "1px solid #ccc",
          }}
        >
          {/* Items */}
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${timeline.projectToChunk(item)}px`,
                width:
                  timeline
                    .getViewport()
                    .getStore()
                    .select((s) => s.pxPerUnit) * 100,
                height: 20,
                background: idx % 2 === 0 ? "tomato" : "orange",
              }}
            />
          ))}

          {/* Current position line */}
          <div
            style={{
              position: "absolute",
              left: timeline.projectToChunk(now),
              top: 0,
              width: 2,
              height: "100%",
              background: "blue",
            }}
          />
        </div>
      </div>
      <pre>{JSON.stringify(timeline.getStore().getState(), null, 2)}</pre>
    </div>
  );
}
