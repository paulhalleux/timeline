import { TimelineViewport } from "./timeline-viewport";
import { Store } from "@ptl/store";
import type { TimelineState } from "./state";
import { computeChunk } from "./chunk";

export type TimelineOptions = {
  /**
   * Initial current position on the timeline.
   */
  currentPosition?: number;

  /**
   * Header offset in pixels.
   * @remarks This can still be changed later via the TimelineViewport.setHeaderOffsetPx method.
   * @default 0
   */
  headerOffsetPx?: number;

  /**
   * Visible range of the timeline in units.
   * @remarks This can still be changed later via the TimelineViewport.setVisibleRange method.
   * @default maxVisibleRange
   */
  visibleRange?: number;

  /**
   * Minimum visible range of the timeline in units.
   */
  minVisibleRange: number;

  /**
   * Maximum visible range of the timeline in units.
   */
  maxVisibleRange: number;

  /**
   * The size of each chunk.
   *
   * Represents the width of each chunk in amount of viewport widths.
   *
   * @example chunkSize = 2 means each chunk is twice the width of the viewport.
   * @remarks If not provided, it defaults to 2
   * @remarks should be minimum 2
   */
  chunkSize?: number;
};

export class Timeline {
  private readonly store: Store<TimelineState>;
  private readonly viewport: TimelineViewport;

  constructor(private readonly options: TimelineOptions) {
    this.store = new Store<TimelineState>({
      current: options.currentPosition ?? 0,
      chunkIndex: 0,
      chunkStart: 0,
      chunkDuration: 0,
    });

    this.viewport = new TimelineViewport({
      visibleRange: options.visibleRange ?? options.maxVisibleRange,
      headerOffsetPx: options.headerOffsetPx ?? 0,
    });

    this.subscribeToViewportChanges();
  }

  /**
   * Gets the timeline viewport.
   *
   * @returns The timeline viewport instance.
   */
  getViewport(): TimelineViewport {
    return this.viewport;
  }

  /**
   * Gets the timeline state store.
   *
   * @returns The store containing the timeline state.
   */
  getStore(): Store<TimelineState> {
    return this.store;
  }

  /**
   * Connects the timeline to a container element.
   *
   * @param element The HTML element to connect to, or null to disconnect.
   */
  connect(element: HTMLElement | null): void {
    this.viewport.setContainer(element);
  }

  /**
   * Sets the current position on the timeline.
   *
   * @param position The position to set.
   */
  setCurrentPosition(position: number): void {
    const viewportStore = this.viewport.getStore();
    const viewportWidthPx = viewportStore.select((state) => state.widthPx);

    const { index, start } = computeChunk(
      position,
      viewportStore.select((state) => state.pxPerUnit),
      // -1 to reset the chunk when remaining visible range is less than one viewport width
      ((this.options.chunkSize ?? 2) - 1) * viewportWidthPx,
    );

    this.store.setState((prev) => ({
      ...prev,
      current: position,
      chunkIndex: index,
      chunkStart: start,
    }));
  }

  /**
   * Zoom the timeline using a normalized slider.
   * @param value 0 = maxVisibleRange, 1 = minVisibleRange
   * @param centerPx optional pixel position to zoom around (mine is 0, max is viewport width, default is 0)
   */
  setZoom(value: number, centerPx?: number): void {
    const min = this.options.minVisibleRange;
    const max = this.options.maxVisibleRange;

    const vpStore = this.viewport.getStore();
    const viewportWidthPx = vpStore.select((s) => s.widthPx);
    const currentPos = this.store.select((s) => s.current);

    const normalizedCenterPx = Math.min(centerPx ?? 0, viewportWidthPx);

    // Compute new visibleRange
    const newVisibleRange = max - value * (max - min);
    const deltaRange = newVisibleRange - vpStore.select((s) => s.visibleRange);
    const centerDelta = (1 / viewportWidthPx) * normalizedCenterPx;

    // Set new viewport range
    this.viewport.setVisibleRange(newVisibleRange);
    this.setCurrentPosition(Math.max(0, currentPos - deltaRange * centerDelta));
  }

  /**
   * Projects a value from timeline units to pixel coordinates within the current chunk.
   *
   * @param value The value in timeline units to project.
   * @returns The projected value in pixels.
   */
  projectToChunk(value: number): number {
    const viewportStore = this.viewport.getStore();

    const pxPerUnit = viewportStore.select((state) => state.pxPerUnit);
    const chunkStart = this.store.select((state) => state.chunkStart);

    return (value - chunkStart) * pxPerUnit;
  }

  /**
   * Projects a pixel position within the viewport to timeline units.
   *
   * @param viewportPosition The pixel position within the viewport.
   * @returns The projected value in timeline units.
   */
  projectToUnit(viewportPosition: number): number {
    const viewportStore = this.viewport.getStore();

    const pxPerUnit = viewportStore.select((state) => state.pxPerUnit);
    const chunkStart = this.store.select((state) => state.chunkStart);

    return chunkStart + viewportPosition / pxPerUnit;
  }

  /**
   * Converts a value from timeline units to pixels.
   *
   * @param value The value in timeline units.
   * @returns The value converted to pixels.
   */
  unitToPx(value: number): number {
    const viewportStore = this.viewport.getStore();
    const pxPerUnit = viewportStore.select((state) => state.pxPerUnit);
    return value * pxPerUnit;
  }

  /**
   * Converts a value from pixels to timeline units.
   *
   * @param value The value in pixels.
   * @returns The value converted to timeline units.
   */
  pxToUnit(value: number): number {
    const viewportStore = this.viewport.getStore();
    const pxPerUnit = viewportStore.select((state) => state.pxPerUnit);
    return value / pxPerUnit;
  }

  /**
   * Returns the X translation (in px) of the current viewport inside the current chunk.
   * Automatically handles the "chunk sliding window" logic to avoid empty space.
   */
  getTranslatePx(): number {
    const current = this.store.select((s) => s.current);
    return this.projectToChunk(current);
  }

  /**
   * Gets the width of a chunk in pixels.
   *
   * @returns The chunk width in pixels.
   */
  getChunkWidthPx(): number {
    const viewportStore = this.viewport.getStore();
    const viewportWidthPx = viewportStore.select((state) => state.widthPx);
    const chunkSize = Math.max(2, this.options.chunkSize ?? 2);
    return chunkSize * viewportWidthPx;
  }

  /**
   * Gets the current zoom level of the timeline.
   *
   * @returns The zoom level as a normalized value between 0 and 1.
   */
  getZoomLevel(): number {
    const vpStore = this.viewport.getStore();
    const min = this.options.minVisibleRange;
    const max = this.options.maxVisibleRange;
    const visibleRange = vpStore.select((s) => s.visibleRange);

    return (max - visibleRange) / (max - min);
  }

  /**
   * Subscribes to changes in the viewport and updates the current chunk accordingly.
   *
   * @private
   */
  private subscribeToViewportChanges(): void {
    const viewportStore = this.viewport.getStore();
    viewportStore.subscribe((vp) => {
      const viewportWidthPx = viewportStore.select((state) => state.widthPx);
      const visibleRange = viewportStore.select((state) => state.visibleRange);
      const chunkSize = Math.max(2, this.options.chunkSize ?? 2);

      const { index, start } = computeChunk(
        this.store.select((state) => state.current),
        vp.pxPerUnit,
        (chunkSize - 1) * viewportWidthPx,
      );

      this.store.setState((prev) => ({
        ...prev,
        chunkIndex: index,
        chunkStart: start,
        chunkDuration: visibleRange * chunkSize,
      }));
    });
  }
}
