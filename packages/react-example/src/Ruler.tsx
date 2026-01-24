import { RulerModule } from "@ptl/timeline-core";
import { useRuler, useTimelineStore } from "@ptl/timeline-react";

export const Ruler = ({ ruler }: { ruler: RulerModule }) => {
  const { ticks, prevIntervalTime } = useRuler(ruler);
  const tickWidth = useTimelineStore((timeline) =>
    timeline.unitToPx(prevIntervalTime),
  );

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
      {ticks.map((unit) => (
        <RulerTick key={unit} unit={unit} tickWidth={tickWidth} />
      ))}
    </div>
  );
};

const RulerTick = ({
  unit,
  tickWidth,
}: {
  unit: number;
  tickWidth: number;
}) => {
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
};

const getSubTickCount = (interval: number): number => {
  if (interval >= 1000) return 10;
  if (interval >= 100) return 6;
  if (interval >= 10) return 4;
  return 2;
};
