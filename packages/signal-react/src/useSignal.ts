import type { Signal } from "@ptl/signal";
import React from "react";

/**
 * React hook to subscribe to a Signal and get its current value.
 *
 * @template T - The type of the signal's value.
 * @param signal - The Signal to subscribe to.
 * @returns The current value of the signal.
 */
export const useSignal = <T>(signal: Signal<T>): T => {
  return React.useSyncExternalStore(
    (callback) => signal.subscribe(callback),
    () => signal.get(),
    () => signal.get(),
  );
};
