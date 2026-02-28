import { RulerHeader, RulerRoot, RulerTick, RulerTicks } from "./ruler.tsx";
import {
  TimelineOverlay,
  TimelineRoot,
  TimelineTrack,
  TimelineTrackContent,
  TimelineTrackHeader,
  TimelineTrackItem,
  TimelineViewport,
} from "./timeline.tsx";
import { WaveformCanvas, WaveformHeader, WaveformRoot } from "./waveform.tsx";

export const Timeline = {
  Root: TimelineRoot,
  Overlay: TimelineOverlay,
  Viewport: TimelineViewport,
  Track: TimelineTrack,
  TrackHeader: TimelineTrackHeader,
  TrackContent: TimelineTrackContent,
  TrackItem: TimelineTrackItem,
};

export const Ruler = {
  Root: RulerRoot,
  Header: RulerHeader,
  Ticks: RulerTicks,
  Tick: RulerTick,
};

export const WaveformTrack = {
  Root: WaveformRoot,
  Header: WaveformHeader,
  Canvas: WaveformCanvas,
};

export { Playhead } from "./playhead.tsx";
