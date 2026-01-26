import { RulerModule } from "@ptl/timeline-core";
import {
  useRuler,
  useTimeline,
  useTimelineStore,
  useViewport,
} from "@ptl/timeline-react";
import { PlayheadModule } from "@ptl/timeline-core";
import React from "react";

export const Ruler = () => {
  const timeline = useTimeline();
  const viewport = useViewport();
  const ruler = timeline.getModule(RulerModule);
  const { ticks, prevIntervalTime } = useRuler(ruler);

  const playhead = timeline.getModule(PlayheadModule);
  const tickWidth = useTimelineStore((timeline) =>
    timeline.unitToPx(prevIntervalTime),
  );

  return (
    <div
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = timeline.projectToUnit(x);
        playhead.setPosition(time);
      }}
      style={{
        position: "relative",
        top: 0,
        left: -viewport.translatePx,
        height: 20,
        width: "100%",
        fontSize: 10,
        zIndex: 10,
      }}
    >
      {ticks.map((unit) => (
        <RulerTick key={unit} unit={unit} tickWidth={tickWidth} />
      ))}
    </div>
  );
};

export const RulerHeader = () => {
  const width = useTimelineStore((timeline) =>
    timeline.getViewport().select((s) => s.headerOffsetPx),
  );

  return (
    <div
      style={{
        width,
        height: "100%",
        borderRight: "1px solid black",
        flexShrink: 0,
        zIndex: 15,
        background: "#f0f0f0",
      }}
    />
  );
};

const RulerTick = React.memo(
  ({ unit, tickWidth }: { unit: number; tickWidth: number }) => {
    const x = useTimelineStore((timeline) => timeline.projectToChunk(unit));
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          backgroundImage: `repeating-linear-gradient(to right, black, black 1.05px, transparent 1px, transparent ${
            tickWidth / getSubTickCount(tickWidth)
          }px)`,
          height: 5,
          width: tickWidth - 2,
        }}
      >
        <div
          style={{
            width: 1,
            height: 10,
            background: "black",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 0,
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          {unit}
        </div>
      </div>
    );
  },
);

const getSubTickCount = (interval: number): number => {
  if (interval >= 1000) return 10;
  if (interval >= 100) return 6;
  if (interval >= 10) return 4;
  return 2;
};
