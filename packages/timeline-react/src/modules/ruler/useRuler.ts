import {
  type RulerApi,
  RulerModule,
  type RulerState,
} from "@ptl/timeline-core";
import React from "react";

import { useTimeline } from "../../timeline";

export const useRuler = (): [RulerState, RulerApi] => {
  const timeline = useTimeline();
  const ruler = timeline.getModule(RulerModule);

  const state = React.useSyncExternalStore(
    (callback) => ruler.getStore().subscribe(callback),
    () => ruler.getStore().get(),
    () => ruler.getStore().get(),
  );

  return [state, ruler];
};
