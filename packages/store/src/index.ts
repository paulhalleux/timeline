export type Listener<T> = (state: T) => void

/**
 * A simple state store with subscription capabilities.
 * @template T Type of the state.
 */
export class Store<T> {
  private state: T
  private listeners = new Set<Listener<T>>()

  constructor(initial: T) {
    this.state = initial
  }

  /**
   * Returns current state.
   */
  getState(): T {
    return this.state
  }

  /**
   * Updates state using a functional updater.
   * All listeners are synchronously notified.
   * @param updater State updater function.
   */
  setState(updater: (prev: T) => T): void {
    this.state = updater(this.state)
    this.listeners.forEach(l => l(this.state))
  }

  /**
   * Subscribes to state changes.
   * Listener is called immediately with current state.
   * @param listener Listener function.
   * @returns Unsubscribe function.
   */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  /**
   * Selects a slice of the state using a selector function.
   * @param selector Selector function.
   * @returns Selected slice of the state.
   */
  select<S>(selector: (state: T) => S): S {
    return selector(this.state)
  }
}
