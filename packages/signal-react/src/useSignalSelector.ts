import type { Signal } from "@ptl/signal";
import { isEqual } from "es-toolkit";
import React from "react";

type ExtractSignalTypes<T extends Signal<any>[]> = T extends [
  Signal<infer D>,
  ...infer Rest extends Signal<any>[],
]
  ? [D, ...ExtractSignalTypes<Rest>]
  : [];

/**
 * React hook to subscribe to multiple Signals and get a derived value.
 *
 * @template R - The type of the derived value.
 * @param callback - A function that returns the derived value based on the current values of the signals.
 * @param signals - An array of Signals to subscribe to.
 * @returns The derived value.
 */
export const useSignalSelector = <R, S extends Signal<any>[]>(
  callback: (values: ExtractSignalTypes<S>) => R,
  signals: S,
) => {
  const latestRef = React.useRef<R>(
    callback(signals.map((signal) => signal.get()) as ExtractSignalTypes<S>),
  );

  const selectWithLatest = React.useCallback(() => {
    const selected = callback(
      signals.map((signal) => signal.get()) as ExtractSignalTypes<S>,
    );
    if (isEqual(latestRef.current, selected)) {
      return latestRef.current;
    }
    latestRef.current = selected;
    return selected;
  }, [callback, signals]);

  return React.useSyncExternalStore(
    (cb) => {
      const unsubscribes = signals.map((signal) => signal.subscribe(cb));
      return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
      };
    },
    () => selectWithLatest(),
    () => selectWithLatest(),
  );
};
