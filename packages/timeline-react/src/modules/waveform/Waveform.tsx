import React from "react";

import { type TimelineApi, WaveformModule } from "@ptl/timeline-core";

import { Translate, useTimeline, useTimelineStore } from "../../timeline";
import { useWaveform } from "./useWaveform.ts";

type WaveformRootProps = React.ComponentProps<"div">;
const WaveformRoot = ({ children, style, ...rest }: WaveformRootProps) => {
  return (
    <div
      style={{
        display: "flex",
        isolation: "isolate",
        flexShrink: 0,
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

const selectTrackHeaderWidth = (timeline: TimelineApi) =>
  timeline.getViewport().getHeaderOffsetPx();

type WaveformHeaderProps = React.ComponentProps<"div">;
const WaveformHeader = ({ children, style, ...rest }: WaveformHeaderProps) => {
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

type WaveformCanvasProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Height of the waveform area in pixels */
  height?: number;
  /** Color of the waveform bars */
  color?: string;
  /** Background color */
  backgroundColor?: string;
};

const WaveformCanvas = ({
  height: heightProp = 60,
  color = "rgba(6, 182, 212, 0.6)",
  backgroundColor = "transparent",
  style,
  ...rest
}: WaveformCanvasProps) => {
  const timeline = useTimeline();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [{ peaks, duration }] = useWaveform();

  const chunkWidth = useTimelineStore((tl) => tl.getChunkWidthPx());
  const viewportWidth = useTimelineStore((tl) => tl.getViewport().select((s) => s.widthPx));
  const chunkStart = useTimelineStore((tl) => tl.getStore().select((s) => s.chunkStart));
  const chunkDuration = useTimelineStore((tl) => tl.getStore().select((s) => s.chunkDuration));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const drawWidth = Math.ceil(chunkWidth);
    const drawHeight = heightProp;

    canvas.width = drawWidth * dpr;
    canvas.height = drawHeight * dpr;
    canvas.style.width = `${drawWidth}px`;
    canvas.style.height = `${drawHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, drawWidth, drawHeight);

    if (!peaks || duration <= 0 || chunkDuration <= 0) return;

    const waveform = WaveformModule.for(timeline);
    const startMs = chunkStart;
    const endMs = chunkStart + chunkDuration;
    // Clamp the end to the audio duration
    const clampedEndMs = Math.min(endMs, duration);
    const clampedDrawWidth = Math.round(drawWidth * ((clampedEndMs - startMs) / (endMs - startMs)));
    const barData = waveform.getPeaksForRange(startMs, clampedEndMs, clampedDrawWidth);

    // Draw waveform only for the region with audio
    ctx.fillStyle = color;
    const centerY = drawHeight / 2;

    for (let i = 0; i < barData.length; i++) {
      const amplitude = barData[i] ?? 0;
      const barHeight = amplitude * drawHeight * 0.9;
      const halfBar = barHeight / 2;
      ctx.fillRect(i, centerY - halfBar, 1, barHeight || 0.5);
    }
  }, [peaks, duration, chunkWidth, chunkStart, chunkDuration, heightProp, color, timeline]);

  return (
    <Translate
      style={{
        position: "relative",
        height: heightProp,
        zIndex: 1,
        width: viewportWidth,
        ...style,
      }}
      {...rest}
    >
      <canvas
        aria-label="Waveform"
        ref={canvasRef}
        style={{
          display: "block",
          backgroundColor,
        }}
      />
    </Translate>
  );
};

export const Waveform = {
  Root: WaveformRoot,
  Header: WaveformHeader,
  Canvas: WaveformCanvas,
};
