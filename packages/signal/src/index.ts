import { isEqual } from "es-toolkit";

/**
 * A subscriber function that gets called with the new value of the signal
 */
export type SignalSubscriber<T> = (value: T) => void;

/**
 * A reactive signal that holds a value of type T and notifies subscribers on changes
 */
export interface Signal<T> {
  get(): T;
  subscribe(listener: SignalSubscriber<T>): () => void;
}

/**
 * A writable signal that allows getting and setting the value, notifying subscribers on changes
 */
export class WritableSignal<T> implements Signal<T> {
  private value: T;
  private listeners = new Set<SignalSubscriber<T>>();

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    if (isEqual(value, this.value)) return;
    this.value = value;
    for (const l of this.listeners) l(value);
  }

  subscribe(listener: SignalSubscriber<T>): () => void {
    this.listeners.add(listener);
    listener(this.value);
    return () => this.listeners.delete(listener);
  }

  derive<U>(fn: (value: T) => U): Signal<U> {
    const derivedSignal = new WritableSignal<U>(fn(this.value));
    this.subscribe((newValue) => {
      derivedSignal.set(fn(newValue));
    });
    return derivedSignal;
  }
}
