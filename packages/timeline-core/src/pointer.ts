import { WritableSignal } from "@ptl/signal";

/**
 * Represents the state of a pointer, including its position, target element,
 * pointer ID, and whether it is currently pressed down.
 */
export type PointerState = {
  position: { x: number; y: number };
  relativePosition: { x: number; y: number };
  target: EventTarget | null;
  pointerId: number | null;
  isDown: boolean;
  button: "left" | "middle" | "right" | null;
};

export type PointerManagerOptions = {
  computeRelativePosition?: (
    e: PointerEvent,
    element: HTMLElement,
  ) => { x: number; y: number };
};

/**
 * Manages pointer events on a given HTML element and provides a signal-based
 * interface to track the pointer state.
 */
export class PointerManager extends WritableSignal<PointerState> {
  private controller: AbortController | null = null;

  constructor(private readonly options: PointerManagerOptions = {}) {
    super({
      position: { x: 0, y: 0 },
      relativePosition: { x: 0, y: 0 },
      target: null,
      pointerId: null,
      isDown: false,
      button: null,
    });
  }

  /**
   * Connects the pointer manager to the specified HTML element, setting up
   * event listeners for pointer events.
   * @param element The HTML element to attach pointer event listeners to.
   */
  connect(element: HTMLElement) {
    this.disconnect();
    this.controller = new AbortController();
    const { signal } = this.controller;

    window.addEventListener(
      "pointerdown",
      (e) => {
        this.set({
          position: { x: e.clientX, y: e.clientY },
          relativePosition: this.getRelativePosition(e, element),
          target: e.target,
          pointerId: e.pointerId,
          isDown: true,
          button: this.getButton(e),
        });
      },
      { signal },
    );

    window.addEventListener(
      "pointermove",
      (e) => {
        this.set({
          ...this.get(),
          position: { x: e.clientX, y: e.clientY },
          relativePosition: this.getRelativePosition(e, element),
        });
      },
      { signal },
    );

    window.addEventListener(
      "pointerup",
      (e) => {
        this.set({
          ...this.get(),
          position: { x: e.clientX, y: e.clientY },
          relativePosition: this.getRelativePosition(e, element),
          target: null,
          isDown: false,
          button: null,
        });
      },
      { signal },
    );

    window.addEventListener(
      "pointercancel",
      (e) => {
        this.set({
          ...this.get(),
          position: { x: e.clientX, y: e.clientY },
          relativePosition: this.getRelativePosition(e, element),
          target: null,
          isDown: false,
          button: null,
        });
      },
      { signal },
    );

    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && this.get().isDown) {
          this.set({
            ...this.get(),
            target: null,
            pointerId: null,
            isDown: false,
            button: null,
          });
        }
      },
      { signal },
    );
  }

  /**
   * Disconnects the pointer manager by aborting all event listeners.
   */
  disconnect() {
    this.controller?.abort();
  }

  /**
   * Calculates the relative position of the pointer event within the given element.
   */
  private getRelativePosition(e: PointerEvent, element: HTMLElement) {
    if (this.options.computeRelativePosition) {
      return this.options.computeRelativePosition(e, element);
    }

    const rect = element.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  /**
   * Determines which mouse button was pressed based on the PointerEvent.
   */
  private getButton(e: PointerEvent): "left" | "middle" | "right" {
    switch (e.button) {
      case 0:
        return "left";
      case 1:
        return "middle";
      case 2:
        return "right";
      default:
        return "left"; // Default to left if unknown
    }
  }
}
