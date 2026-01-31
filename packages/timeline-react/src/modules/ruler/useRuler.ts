import { useSignal } from "@ptl/signal-react";
import {
  type RulerApi,
  RulerModule,
  type RulerState,
} from "@ptl/timeline-core";

import { useTimeline } from "../../timeline";

/**
 * Hook to access the ruler module and its state within the timeline.
 *
 * @returns An array containing the ruler state and the ruler API.
 */
export const useRuler = (): [RulerState, RulerApi] => {
  const timeline = useTimeline();
  const ruler = RulerModule.for(timeline);
  const state = useSignal(ruler.getStore());
  return [state, ruler];
};

/**
 * Hook to access only the ruler API within the timeline.
 *
 * @returns The ruler API instance.
 */
export const useRulerApi = (): RulerApi => {
  const timeline = useTimeline();
  return RulerModule.for(timeline);
};
