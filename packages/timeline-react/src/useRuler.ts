import { RulerModule } from "@ptl/timeline-core";
import React from "react";

export const useRuler = (ruler: RulerModule) => {
  return React.useSyncExternalStore(
    (callback) => ruler.subscribe(callback),
    () => ruler.getState(),
    () => ruler.getState(),
  );
};
