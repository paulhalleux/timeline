import { WritableSignal } from "@ptl/signal";
import { enableMapSet, produce, type WritableDraft } from "immer";

enableMapSet();

/**
 * A simple state management store that allows getting, setting, selecting,
 * and subscribing to state changes.
 *
 * @implements {Signal<T>} - Implements the Signal interface for state change notifications.
 * @template T - The type of the state managed by the store.
 */
export class Store<T> extends WritableSignal<T> {
  constructor(initial: T) {
    super(initial);
  }

  /**
   * Updates the state using an updater function.
   * @param updater - Function that receives the previous state and returns the new state.
   */
  update(updater: (prev: WritableDraft<T>) => void): void {
    const next = produce(this.get(), updater);
    this.set(next);
  }

  /**
   * Selects a slice of the state.
   * @param selector - Function to select a slice of the state.
   * @returns The selected slice of state.
   */
  select<S>(selector: (state: T) => S): S {
    return selector(this.get());
  }
}
