import { Store } from "@ptl/store";

import { type TimelineApi } from "../timeline";
import type { TimelineModule } from "../timeline-module";

export type ViewportDragState = {
  isDragging: boolean;
};

export type ViewportDragApi = {
  getStore(): Store<ViewportDragState>;
  isDragging(): boolean;
};

export class ViewportDragModule implements TimelineModule<ViewportDragApi> {
  static id = "ViewportDragModule";

  private readonly store: Store<ViewportDragState>;
  private controller: AbortController | null = null;

  constructor() {
    this.store = new Store<ViewportDragState>({
      isDragging: false,
    });
  }

  // Static Methods

  /**
   * Gets the ViewportDragModule instance from the given TimelineApi.
   * @param timeline
   */
  static for(timeline: TimelineApi): ViewportDragModule {
    return timeline.getModule(this);
  }

  // Lifecycle Methods

  attach(timeline: TimelineApi): void {
    let prevConnected = false;
    timeline.getViewport().subscribe((state) => {
      if (this.controller) {
        this.controller.abort();
      }

      if (!state.connected || prevConnected === state.connected) {
        prevConnected = state.connected;
        return;
      }

      this.controller = new AbortController();
      const signal = this.controller.signal;
      this.connectEvents(timeline, signal);
    });
  }

  detach(): void {
    if (!this.controller) {
      return;
    }

    this.controller.abort();
    this.controller = null;
  }

  getStore(): Store<ViewportDragState> {
    return this.store;
  }

  // API Methods

  /**
   * Checks if the viewport is currently being dragged.
   * @returns A boolean indicating if dragging is in progress.
   */
  isDragging(): boolean {
    return this.store.select((state) => state.isDragging);
  }

  // Private Methods

  private connectEvents(timeline: TimelineApi, signal: AbortSignal): void {
    const viewportElement = timeline.getViewport().getContainer();
    if (!viewportElement) {
      return;
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 1 || !(e.currentTarget instanceof HTMLElement)) {
        return;
      }

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      this.store.set({ isDragging: true });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.store.get().isDragging) {
        return;
      }
      timeline.panByPx(-e.movementX);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      this.store.set({ isDragging: false });
    };

    viewportElement.addEventListener("pointerdown", onPointerDown, { signal });
    viewportElement.addEventListener("pointermove", onPointerMove, { signal });
    viewportElement.addEventListener("pointerup", onPointerUp, { signal });
  }
}
