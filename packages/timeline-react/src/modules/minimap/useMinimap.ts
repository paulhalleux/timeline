import { useSignal } from "@ptl/signal-react";
import {
  type MinimapApi,
  MinimapModule,
  type MinimapState,
} from "@ptl/timeline-core";

import { useTimeline } from "../../timeline";

/**
 * Hook to access the minimap module and its state within the timeline.
 *
 * @returns An object containing the minimap API and its current state.
 */
export const useMinimap = (): [MinimapState, MinimapApi] => {
  const timeline = useTimeline();
  const minimap = MinimapModule.for(timeline);
  const state = useSignal(minimap.getStore());
  return [state, minimap];
};

/**
 * Hook to access only the minimap API within the timeline.
 *
 * @returns The minimap API instance.
 */
export const useMinimapApi = (): MinimapApi => {
  const timeline = useTimeline();
  return MinimapModule.for(timeline);
};
