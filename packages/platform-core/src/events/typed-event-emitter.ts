import { disposable, type Disposable } from "../lifecycle/disposable";

export type EventMap = object;

/**
 * Minimal typed event wrapper used by platform services.
 *
 * The class deliberately stays small: listeners are strongly typed, `on`
 * returns a disposable subscription, and there is no global event bus hidden
 * behind the API.
 *
 * @example
 * ```ts
 * const events = new TypedEventEmitter<{ changed: { value: number } }>();
 * const subscription = events.on("changed", event => console.log(event.value));
 * events.emit("changed", { value: 1 });
 * subscription.dispose();
 * ```
 */
export class TypedEventEmitter<TEvents extends EventMap> {
  private readonly listeners = new Map<
    keyof TEvents & string,
    Set<(payload: TEvents[keyof TEvents & string]) => void>
  >();

  on<TKey extends keyof TEvents & string>(
    event: TKey,
    listener: (payload: TEvents[TKey]) => void,
  ): Disposable {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as (payload: TEvents[keyof TEvents & string]) => void);
    this.listeners.set(event, listeners);

    return disposable(() => {
      listeners.delete(listener as (payload: TEvents[keyof TEvents & string]) => void);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    });
  }

  emit<TKey extends keyof TEvents & string>(event: TKey, payload: TEvents[TKey]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }
}
