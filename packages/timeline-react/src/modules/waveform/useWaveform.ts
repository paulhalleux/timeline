import { useStore } from "@ptl/store/react";
import { type WaveformApi, WaveformModule, type WaveformState } from "@ptl/timeline-core";

import { useTimeline } from "../../timeline";

/**
 * Hook to access the waveform module and its state within the timeline.
 *
 * @returns An array containing the waveform state and the waveform API.
 */
export const useWaveform = (): [WaveformState, WaveformApi] => {
  const timeline = useTimeline();
  const waveform = WaveformModule.for(timeline);
  const state = useStore(waveform.getStore());
  return [state, waveform];
};

/**
 * Hook to access only the waveform API within the timeline.
 *
 * @returns The waveform API instance.
 */
export const useWaveformApi = (): WaveformApi => {
  const timeline = useTimeline();
  return WaveformModule.for(timeline);
};
