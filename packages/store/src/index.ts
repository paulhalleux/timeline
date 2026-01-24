import { isEqual } from "es-toolkit";

export type Listener<T> = (state: T) => void;

export type Subscription<T, S = T> = {
  listener: Listener<S>;
  selector?: (state: T) => S;
  lastState: T;
};

/**
 * A simple state store with subscription capabilities.
 * @template T Type of the state.
 */
export class Store<T> {
  private state: T;
  private subscribers: Set<Subscription<T, any>> = new Set();

  constructor(initial: T) {
    this.state = initial;
  }

  /**
   * Returns current state.
   */
  getState(): T {
    return this.state;
  }

  /**
   * Updates state using a functional updater.
   * All listeners are synchronously notified.
   * @param updater State updater function.
   */
  setState(updater: (prev: T) => T): void {
    this.state = updater(this.state);
    this.emit();
  }

  /**
   * Subscribes to state changes.
   * @param listener Listener function.
   * @param selector Optional selector function to select a slice of the state.
   * @returns Unsubscribe function.
   */
  subscribe<S = T>(
    listener: Listener<S>,
    selector?: (state: T) => S,
  ): () => void {
    const subscription: Subscription<T, S> = {
      listener,
      selector,
      lastState: (selector?.(this.state) ?? this.state) as any,
    };

    this.subscribers.add(subscription);
    return () => {
      this.subscribers.delete(subscription);
    };
  }

  /**
   * Selects a slice of the state using a selector function.
   * @param selector Selector function.
   * @returns Selected slice of the state.
   */
  select<S>(selector: (state: T) => S): S {
    return selector(this.state);
  }

  /**
   * Emits state changes to subscribers.
   * @private
   */
  private emit(): void {
    for (const sub of this.subscribers) {
      const selectedState = sub.selector
        ? sub.selector(this.state)
        : this.state;

      if (!isEqual(sub.lastState, selectedState)) {
        sub.lastState = selectedState;
        sub.listener(selectedState);
      }
    }
  }
}
