import { isEqual } from "es-toolkit";
import React from "react";

import type { Store } from "./index";

/**
 * React hook to subscribe to a Store and get its current value.
 *
 * @param store - The Store to subscribe to.
 * @returns The current value of the store.
 */
export const useStore = <T>(store: Store<T>): T => {
  return React.useSyncExternalStore(
    (callback: () => void) => store.subscribe(callback),
    () => store.get(),
    () => store.get(),
  );
};

/**
 * React hook to subscribe to a Store and derive a value from it.
 *
 * @param store - The Store to subscribe to.
 * @param selector - A function that selects/derives a value from the store state.
 * @returns The derived value.
 */
export const useStoreSelector = <T, R>(
  store: Store<T>,
  selector: (state: T) => R,
): R => {
  const latestRef = React.useRef<R>(selector(store.get()));

  const getSnapshot = React.useCallback(() => {
    const selected = selector(store.get());
    if (isEqual(latestRef.current, selected)) {
      return latestRef.current;
    }
    latestRef.current = selected;
    return selected;
  }, [store, selector]);

  return React.useSyncExternalStore(
    (callback: () => void) => store.subscribe(callback),
    getSnapshot,
    getSnapshot,
  );
};

type ExtractStoreTypes<T extends Store<unknown>[]> = T extends [
  Store<infer D>,
  ...infer Rest extends Store<unknown>[],
]
  ? [D, ...ExtractStoreTypes<Rest>]
  : [];

/**
 * React hook to subscribe to multiple Stores and derive a value from all of them.
 *
 * @param stores - An array of Stores to subscribe to.
 * @param selector - A function that receives the current values of all stores and returns a derived value.
 * @returns The derived value.
 */
export const useStoreCombine = <R, S extends Store<unknown>[]>(
  stores: S,
  selector: (values: ExtractStoreTypes<S>) => R,
): R => {
  const latestRef = React.useRef<R>(
    selector(stores.map((store) => store.get()) as ExtractStoreTypes<S>),
  );

  const getSnapshot = React.useCallback(() => {
    const selected = selector(
      stores.map((store) => store.get()) as ExtractStoreTypes<S>,
    );
    if (isEqual(latestRef.current, selected)) {
      return latestRef.current;
    }
    latestRef.current = selected;
    return selected;
  }, [selector, stores]);

  return React.useSyncExternalStore(
    (cb: () => void) => {
      const unsubscribes = stores.map((store) => store.subscribe(cb));
      return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
      };
    },
    getSnapshot,
    getSnapshot,
  );
};
