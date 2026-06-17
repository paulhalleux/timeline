import { disposable, type Disposable } from "../lifecycle/disposable";

export type EventMap = Record<string, unknown>;

export interface EventEmitter<TEvents extends EventMap> {
  on<TKey extends keyof TEvents & string>(
    event: TKey,
    listener: (payload: TEvents[TKey]) => void,
  ): Disposable;
  emit<TKey extends keyof TEvents & string>(event: TKey, payload: TEvents[TKey]): void;
}

export function createEventEmitter<TEvents extends EventMap>(): EventEmitter<TEvents> {
  const listeners = new Map<keyof TEvents & string, Set<(payload: unknown) => void>>();
  return {
    on(event, listener) {
      const eventListeners = listeners.get(event) ?? new Set();
      eventListeners.add(listener as (payload: unknown) => void);
      listeners.set(event, eventListeners);
      return disposable(() => eventListeners.delete(listener as (payload: unknown) => void));
    },
    emit(event, payload) {
      for (const listener of listeners.get(event) ?? []) listener(payload);
    },
  };
}
