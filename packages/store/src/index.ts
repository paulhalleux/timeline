import { isEqual } from "es-toolkit";
import { WritableSignal } from "@ptl/signal";

export class Store<T> extends WritableSignal<T> {
  constructor(initial: T) {
    super(initial);
  }

  /**
   * Retrieves the current state.
   * @returns The current state.
   */
  getState(): T {
    return this.get();
  }

  /**
   * Updates the state using an updater function.
   * @param updater - Function that receives the previous state and returns the new state.
   */
  setState(updater: (prev: T) => T): void {
    const next = updater(this.get());
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

  /**
   * Subscribes to changes in a selected slice of the state.
   * @param selector - Function to select a slice of the state.
   * @param listener - Function to call when the selected slice changes.
   * @returns A function to unsubscribe from the updates.
   */
  subscribeSelector<S>(
    selector: (state: T) => S,
    listener: (value: S) => void,
  ): () => void {
    let last = selector(this.get());

    listener(last);

    return this.subscribe((state) => {
      const next = selector(state);
      if (!isEqual(last, next)) {
        last = next;
        listener(next);
      }
    });
  }
}
