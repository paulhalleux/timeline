import { Store } from "@ptl/store";

export type TimelineViewportState = {
  /**
   * Width of the viewport in pixels
   * @remarks This is the width of the timeline area, excluding any headers or sidebars.
   */
  widthPx: number;

  /**
   * Amount of units visible in the viewport
   * @remarks This is derived from the current scale and the width of the viewport.
   */
  visibleRange: number;

  /**
   * Scale of the timeline in pixels per unit
   * @remarks This determines how many pixels correspond to a single timeline unit (e.g., tick).
   */
  pxPerUnit: number;

  /**
   * Offset in pixels for any headers (e.g., track headers)
   * @remarks This is subtracted from the total width to get the usable timeline width.
   */
  headerOffsetPx: number;
};

export type TimelineViewportOptions = {
  visibleRange: number;
  headerOffsetPx?: number;
};

export class TimelineViewport {
  private readonly store: Store<TimelineViewportState>;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: TimelineViewportOptions) {
    this.store = new Store<TimelineViewportState>({
      visibleRange: options.visibleRange,
      headerOffsetPx: options.headerOffsetPx ?? 0,

      // Initial values; these will be updated when a container is set
      widthPx: 0,
      pxPerUnit: 0,
    });
  }

  /**
   * Sets the container element for the timeline viewport.
   *
   * @param container The HTML element to be used as the container, or null to disconnect.
   * @remarks If the container is null, the viewport will not track size changes.
   * @remarks If the container is set, a ResizeObserver will be used to monitor size changes and update the viewport state accordingly.
   */
  setContainer(container: HTMLElement | null): void {
    if (this.container === container) {
      return;
    }

    this.disconnectContainer();
    if (container) {
      this.connectContainer(container);
    }
  }

  /**
   * Sets the header offset in pixels.
   *
   * @param offsetPx The offset in pixels to be set for the header.
   */
  setHeaderOffsetPx(offsetPx: number): void {
    this.store.setState((prev) => ({
      ...prev,
      headerOffsetPx: offsetPx,
    }));
  }

  /**
   * Sets the visible range of the timeline viewport.
   *
   * @param visibleRange The amount of units to be visible in the viewport.
   */
  setVisibleRange(visibleRange: number): void {
    this.store.setState((prev) => ({
      ...prev,
      visibleRange: visibleRange,
      pxPerUnit: prev.widthPx > 0 ? prev.widthPx / visibleRange : 0,
    }));
  }

  /**
   * Gets the store containing the timeline viewport state.
   *
   * @returns The store with the timeline viewport state.
   */
  getStore(): Store<TimelineViewportState> {
    return this.store;
  }

  /**
   * Checks if the container is currently connected.
   *
   * @returns True if the container is connected, false otherwise.
   */
  isConnected(): boolean {
    return this.container !== null;
  }

  /**
   * Connects the container element and sets up a ResizeObserver to track size changes.
   *
   * @param element The HTML element to be used as the container.
   * @private
   */
  private connectContainer(element: HTMLElement): void {
    const update = () => {
      const headerOffsetPx = this.store.select((state) => state.headerOffsetPx);
      const width = element.clientWidth - headerOffsetPx;
      if (width <= 0) return;

      const widthPx = this.store.select((state) => state.widthPx);
      if (widthPx === width) return;

      this.store.setState((prev) => ({
        ...prev,
        widthPx: width,
        pxPerUnit: width / prev.visibleRange,
      }));
    };

    update();
    this.resizeObserver = new ResizeObserver(update);
    this.resizeObserver.observe(element);
  }

  /**
   * Disconnects the container element and cleans up the ResizeObserver.
   *
   * @private
   */
  private disconnectContainer(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.container = null;
  }
}
