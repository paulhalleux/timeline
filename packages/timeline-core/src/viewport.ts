import { Store } from "@ptl/store";

export type ViewportState = {
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

  /**
   * Indicates whether the viewport is connected to a container element
   */
  connected: boolean;

  /**
   * Minimum visible range allowed
   */
  minVisibleRange: number;

  /**
   * Maximum visible range allowed
   */
  maxVisibleRange: number;
};

/**
 * API for interacting with the TimelineViewport.
 */
export interface ViewportApi {
  getStore(): Store<ViewportState>;
  subscribe(listener: (state: ViewportState) => void): () => void;
  select<T>(selector: (state: ViewportState) => T): T;
  setContainer(container: HTMLElement | null): void;
  getContainer(): HTMLElement | null;
  setHeaderOffsetPx(offsetPx: number): void;
  getHeaderOffsetPx(): number;
  setMinVisibleRange(minVisibleRange: number): void;
  setMaxVisibleRange(maxVisibleRange: number): void;
  getMinVisibleRange(): number;
  getMaxVisibleRange(): number;
  setVisibleRange(visibleRange: number): void;
  getWidth(): number;
  isConnected(): boolean;
}

export type TimelineViewportOptions = {
  visibleRange: number;
  headerOffsetPx?: number;
  minVisibleRange?: number;
  maxVisibleRange?: number;
};

export class Viewport implements ViewportApi {
  private readonly store: Store<ViewportState>;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: TimelineViewportOptions) {
    this.store = new Store<ViewportState>({
      visibleRange: options.visibleRange,
      headerOffsetPx: options.headerOffsetPx ?? 0,
      widthPx: 0,
      pxPerUnit: 0,
      connected: false,
      minVisibleRange: options.minVisibleRange ?? 60 * 60,
      maxVisibleRange: options.maxVisibleRange ?? 60 * 60 * 4,
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

    this.container = container;
    this.store.update((prev) => ({
      ...prev,
      connected: container !== null,
    }));
  }

  /**
   * Gets the current container element for the timeline viewport.
   *
   * @returns The HTML element used as the container, or null if not connected.
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Sets the header offset in pixels.
   *
   * @param offsetPx The offset in pixels to be set for the header.
   */
  setHeaderOffsetPx(offsetPx: number): void {
    this.store.update((prev) => ({
      ...prev,
      headerOffsetPx: offsetPx,
    }));
  }

  /**
   * Gets the current header offset in pixels.
   *
   * @returns The current header offset in pixels.
   */
  getHeaderOffsetPx(): number {
    return this.store.select((state) => state.headerOffsetPx);
  }

  /**
   * Sets the visible range of the timeline viewport.
   *
   * @param visibleRange The amount of units to be visible in the viewport.
   */
  setVisibleRange(visibleRange: number): void {
    this.store.update((prev) => ({
      ...prev,
      visibleRange: visibleRange,
      pxPerUnit: prev.widthPx > 0 ? prev.widthPx / visibleRange : 0,
    }));
  }

  /**
   * Sets the minimum visible range allowed for the timeline viewport.
   *
   * @param minVisibleRange The minimum visible range in units.
   */
  setMinVisibleRange(minVisibleRange: number): void {
    this.store.update((prev) => ({
      ...prev,
      minVisibleRange: minVisibleRange,
    }));
  }

  /**
   * Sets the maximum visible range allowed for the timeline viewport.
   *
   * @param maxVisibleRange The maximum visible range in units.
   */
  setMaxVisibleRange(maxVisibleRange: number): void {
    this.store.update((prev) => ({
      ...prev,
      maxVisibleRange: maxVisibleRange,
    }));
  }

  /**
   * Gets the minimum visible range allowed for the timeline viewport.
   *
   * @returns The minimum visible range in units.
   */
  getMinVisibleRange(): number {
    return this.store.select((state) => state.minVisibleRange);
  }

  /**
   * Gets the maximum visible range allowed for the timeline viewport.
   *
   * @returns The maximum visible range in units.
   */
  getMaxVisibleRange(): number {
    return this.store.select((state) => state.maxVisibleRange);
  }

  /**
   * Gets the store containing the timeline viewport state.
   *
   * @returns The store with the timeline viewport state.
   */
  getStore(): Store<ViewportState> {
    return this.store;
  }

  /**
   * Selects a specific slice of the timeline viewport state.
   *
   * @param selector A function that selects a part of the timeline viewport state.
   * @returns The selected part of the timeline viewport state.
   */
  select<T>(selector: (state: ViewportState) => T): T {
    return this.store.select(selector);
  }

  /**
   * Subscribes to changes in the timeline viewport state.
   *
   * @param listener A function that will be called whenever the timeline viewport state changes.
   * @returns A function to unsubscribe from the changes.
   */
  subscribe(listener: (state: ViewportState) => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Checks if the container is currently connected.
   *
   * @returns True if the container is connected, false otherwise.
   */
  isConnected(): boolean {
    return this.store.select((state) => state.connected);
  }

  /**
   * Gets the current width of the timeline viewport in pixels.
   *
   * @returns The width of the timeline viewport in pixels.
   */
  getWidth(): number {
    return this.store.select((state) => state.widthPx);
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

      this.store.update((prev) => ({
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
    this.store.update((prev) => ({
      ...prev,
      widthPx: 0,
      pxPerUnit: 0,
    }));
  }
}
