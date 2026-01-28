import { Translate, useTimelineStore } from "../../timeline";
import type { TimelineApi } from "@ptl/timeline-core";
import { useRuler } from "./useRuler.ts";

type RulerRootProps = React.ComponentProps<"div">;
const RulerRoot = ({ children, style, ...rest }: RulerRootProps) => {
  return (
    <div style={{ display: "flex", isolation: "isolate", ...style }} {...rest}>
      {children}
    </div>
  );
};

const selectTrackHeaderWidth = (timeline: TimelineApi) =>
  timeline.getViewport().getHeaderOffsetPx();

type RulerHeaderProps = React.ComponentProps<"div">;
const RulerHeader = ({ children, style, ...rest }: RulerHeaderProps) => {
  const width = useTimelineStore(selectTrackHeaderWidth);
  return (
    <div
      style={{
        height: "100%",
        flexShrink: 0,
        zIndex: 2,
        width,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

type RulerTicksProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ComponentType<{
    unit: number;
    left: number;
    width: number;
  }>;
};

export const RulerTicks = ({
  children: Tick,
  style,
  ...rest
}: RulerTicksProps) => {
  const [{ prevIntervalTime, ticks }] = useRuler();
  const tickWidth = useTimelineStore((timeline) =>
    timeline.unitToPx(prevIntervalTime),
  );
  const viewportWidth = useTimelineStore((timeline) =>
    timeline.getViewport().select((s) => s.widthPx),
  );

  return (
    <Translate
      style={{
        position: "relative",
        height: "100%",
        zIndex: 1,
        width: viewportWidth,
        ...style,
      }}
      {...rest}
    >
      {Tick &&
        ticks.map((unit, index) => (
          <Tick
            key={unit}
            unit={unit}
            width={tickWidth}
            left={tickWidth * index}
          />
        ))}
    </Translate>
  );
};

export const Ruler = {
  Root: RulerRoot,
  Header: RulerHeader,
  Ticks: RulerTicks,
};
