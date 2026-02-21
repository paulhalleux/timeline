import { isEqual } from "es-toolkit";
import { enableMapSet, produce, type WritableDraft } from "immer";

enableMapSet();

export type StoreSubscriber<T> = (value: T) => void;

/**
 * A simple state management store that allows getting, setting, selecting,
 * and subscribing to state changes.
 *
 * @template T - The type of the state managed by the store.
 */
export class Store<T> {
  private value: T;
  private listeners = new Set<StoreSubscriber<T>>();
  private notifyListeners = new Set<() => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  /**
   * Gets the current value of the store.
   */
  get(): T {
    return this.value;
  }

  /**
   * Sets a new value and notifies subscribers if the value has changed.
   */
  set(value: T): void {
    if (isEqual(value, this.value)) return;
    this.value = value;
    for (const l of this.listeners) l(value);
    for (const l of this.notifyListeners) l();
  }

  /**
   * Updates the state using an Immer updater function.
   * @param updater - Function that receives a mutable draft of the current state.
   */
  update(updater: (prev: WritableDraft<T>) => void): void {
    const next = produce(this.get(), updater);
    this.set(next);
  }

  /**
   * Selects a slice of the state.
   * @param selector - Function to select a slice of the state.
   */
  select<S>(selector: (state: T) => S): S {
    return selector(this.get());
  }

  /**
   * Subscribes a listener to state changes.
   * The listener is called immediately with the current value.
   * @returns An unsubscribe function.
   */
  subscribe(listener: StoreSubscriber<T>): () => void;
  /**
   * Subscribes a notification listener that is called on every change.
   * The listener is NOT called immediately.
   * @returns An unsubscribe function.
   */
  subscribe(listener: () => void): () => void;
  subscribe(listener: StoreSubscriber<T> | (() => void)): () => void {
    if (listener.length === 0) {
      const cb = listener as () => void;
      this.notifyListeners.add(cb);
      return () => this.notifyListeners.delete(cb);
    }
    const cb = listener as StoreSubscriber<T>;
    this.listeners.add(cb);
    cb(this.value);
    return () => this.listeners.delete(cb);
  }
}
