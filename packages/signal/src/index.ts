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
  map<U>(fn: (value: T) => U): Signal<U>;
  filter(predicate: (value: T) => boolean): Signal<void>;
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

  /**
   * Gets the current value of the signal
   * @returns The current value
   */
  get(): T {
    return this.value;
  }

  /**
   * Sets a new value for the signal and notifies subscribers if the value has changed
   * @param value The new value to set
   */
  set(value: T): void {
    if (isEqual(value, this.value)) return;
    this.value = value;
    this.emit(value);
  }

  /**
   * Subscribes a listener to changes in the signal's value
   * @param listener A function that gets called with the new value
   * @returns A function to unsubscribe the listener
   */
  subscribe(listener: SignalSubscriber<T>): () => void {
    this.listeners.add(listener);
    listener(this.value);
    return () => this.listeners.delete(listener);
  }

  /**
   * Creates a new signal by applying the given function to the current value
   * @param fn A function that takes the current value and returns a new value
   * @returns A new {@link Signal} with the transformed value
   */
  map<U>(fn: (value: T) => U): Signal<U> {
    const derivedSignal = new WritableSignal<U>(fn(this.value));
    this.subscribe((newValue) => {
      derivedSignal.set(fn(newValue));
    });
    return derivedSignal;
  }

  /**
   * Creates a new signal that emits whenever the predicate returns true for the current value
   * @param predicate A function that takes the current value and returns a boolean
   * @returns A new {@link Signal} that emits void when the predicate is satisfied
   */
  filter(predicate: (value: T) => boolean): Signal<void> {
    const filteredSignal = new WritableSignal<void>(undefined);

    this.subscribe((newValue) => {
      if (predicate(newValue)) {
        filteredSignal.emit(undefined);
      }
    });

    return filteredSignal;
  }

  /**
   * Converts this writable signal to a readonly signal
   * @returns A readonly {@link Signal} instance
   */
  toReadonly(): Signal<T> {
    return {
      get: this.get.bind(this),
      subscribe: this.subscribe.bind(this),
      map: this.map.bind(this),
      filter: this.filter.bind(this),
    };
  }

  /** Emits the given value to all subscribers */
  emit(value: T): void {
    for (const l of this.listeners) l(value);
  }
}

export function signal(): WritableSignal<void>;
export function signal<T>(initial: T): WritableSignal<T>;
export function signal<T>(initial?: T): WritableSignal<any> {
  if (arguments.length === 0) {
    return new WritableSignal<void>(undefined);
  }
  return new WritableSignal(initial);
}
