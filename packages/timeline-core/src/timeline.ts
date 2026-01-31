import { Store } from "@ptl/store";

import { computeChunk } from "./chunk";
import type { TimelineState } from "./state";
import type { TimelineModule } from "./timeline-module";
import { Viewport, type ViewportApi } from "./viewport";

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

  /**
   * Initial modules to register with the timeline.
   */
  modules?: TimelineModule[];
};

export interface TimelineApi {
  // State related
  getStore(): Store<TimelineState>;
  select<S>(selector: (state: TimelineState) => S): S;
  subscribe(listener: (selectedState: TimelineState) => void): () => void;
  getOptions(): TimelineOptions;
  getModule<T extends TimelineModule>(moduleClass: {
    new (...args: any[]): T;
    id: string;
  }): T;

  // Viewport related
  getViewport(): ViewportApi;
  connect(element: HTMLElement | null): void;

  // Timeline operations
  setCurrentPosition(position: number): void;
  setZoom(value: number, centerPx?: number): void;
  panByUnits(deltaUnits: number): void;
  panByPx(deltaPx: number): void;

  // Projections and conversions
  projectToChunk(value: number): number;
  projectToUnit(viewportPosition: number): number;
  unitToPx(value: number): number;
  pxToUnit(value: number): number;

  // Utilities
  getTranslatePx(): number;
  getChunkWidthPx(): number;
  getZoomLevel(): number;

  // Range info
  getBounds(): { start: number; end: number };
  getVisibleRange(): number;
  getChunkRange(): number;
  setVisibleRange(visibleRange: number): void;
}

export class Timeline implements TimelineApi {
  private readonly store: Store<TimelineState>;
  private readonly viewport: Viewport;

  private modules: TimelineModule[] = [];

  constructor(private readonly options: TimelineOptions) {
    this.store = new Store<TimelineState>({
      current: Math.max(0, options.currentPosition ?? 0),
      chunkIndex: 0,
      chunkStart: 0,
      chunkDuration: 0,
    });

    this.viewport = new Viewport({
      visibleRange: options.visibleRange ?? options.maxVisibleRange,
      headerOffsetPx: options.headerOffsetPx ?? 0,
      minVisibleRange: options.minVisibleRange,
      maxVisibleRange: options.maxVisibleRange,
    });

    this.subscribeToViewportChanges();

    // Register initial modules
    options.modules?.forEach((module) => this.registerModule(module));
  }

  /**
   * Gets the timeline options.
   *
   * @returns The timeline options.
   */
  getOptions(): TimelineOptions {
    return this.options;
  }

  /**
   * Registers a module with the timeline.
   *
   * @param module The module to register.
   */
  registerModule(module: TimelineModule): void {
    module.detach?.(); // Detach if already attached
    module.attach(this);
    this.modules.push(module);
  }

  /**
   * Gets a registered module by its class.
   *
   * @param moduleClass The class of the module to retrieve.
   * @returns The registered module instance, or undefined if not found.
   */
  getModule<T extends TimelineModule>(moduleClass: {
    new (...args: any[]): T;
    id: string;
  }): T {
    const module = this.modules.find(
      (module) => (module.constructor as any).id === moduleClass.id,
    );
    if (!module) {
      throw new Error(`Module ${moduleClass.id} not found`);
    }
    return module as T;
  }

  /**
   * Destroys the timeline instance and detaches all registered modules.
   */
  destroy(): void {
    this.modules.forEach((module) => {
      module.detach?.();
    });
    this.modules = [];
  }

  /**
   * Gets the timeline viewport.
   *
   * @returns The timeline viewport instance.
   */
  getViewport(): Viewport {
    return this.viewport;
  }

  /**
   * Gets the current state of the timeline.
   *
   * @returns The current timeline state.
   */
  getStore(): Store<TimelineState> {
    return this.store;
  }

  /**
   * Selects a subset of the timeline state.
   *
   * @param selector The selector function to select a subset of the state.
   * @returns The selected subset of the timeline state.
   */
  select<S>(selector: (state: TimelineState) => S): S {
    return this.store.select(selector);
  }

  /**
   * Subscribes to changes in the timeline state.
   *
   * @param listener The listener function to be called on state changes.
   * @returns A function to unsubscribe from the state changes.
   */
  subscribe(listener: (selectedState: TimelineState) => void): () => void {
    return this.store.subscribe(listener);
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
    const viewportWidthPx = this.viewport.select((state) => state.widthPx);
    const normalizedPosition = Math.max(0, Math.floor(position));

    const { index, start } = computeChunk(
      normalizedPosition,
      this.viewport.select((state) => state.pxPerUnit),
      // -1 to reset the chunk when remaining visible range is less than one viewport width
      ((this.options.chunkSize ?? 2) - 1) * viewportWidthPx,
    );

    this.store.update((prev) => ({
      ...prev,
      current: normalizedPosition,
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
    const min = this.getViewport().getMinVisibleRange();
    const max = this.getViewport().getMaxVisibleRange();

    const viewportWidthPx = this.viewport.select((s) => s.widthPx);
    const currentPos = this.store.select((s) => s.current);

    const normalizedCenterPx = Math.min(centerPx ?? 0, viewportWidthPx);

    // Compute new visibleRange
    const newVisibleRange = max - value * (max - min);
    const deltaRange =
      newVisibleRange - this.viewport.select((s) => s.visibleRange);
    const centerDelta = (1 / viewportWidthPx) * normalizedCenterPx;

    // Set new viewport range
    this.viewport.setVisibleRange(newVisibleRange);
    this.setCurrentPosition(currentPos - deltaRange * centerDelta);
  }

  /**
   * Pans the timeline by a specified amount in timeline units.
   *
   * @param deltaUnits The amount to pan in timeline units.
   */
  panByUnits(deltaUnits: number): void {
    const currentPos = this.store.select((s) => s.current);
    this.setCurrentPosition(currentPos + deltaUnits);
  }

  /**
   * Pans the timeline by a specified amount in pixels.
   *
   * @param deltaPx The amount to pan in pixels.
   */
  panByPx(deltaPx: number): void {
    const units = this.pxToUnit(deltaPx);
    this.panByUnits(units);
  }

  /**
   * Projects a value from timeline units to pixel coordinates within the current chunk.
   *
   * @param value The value in timeline units to project.
   * @returns The projected value in pixels.
   */
  projectToChunk(value: number): number {
    if (!this.getViewport().isConnected()) {
      return 0;
    }

    const pxPerUnit = this.viewport.select((state) => state.pxPerUnit);
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
    if (!this.getViewport().isConnected()) {
      return 0;
    }

    const pxPerUnit = this.viewport.select((state) => state.pxPerUnit);
    const chunkStart = this.store.select((state) => state.chunkStart);
    return Math.abs(chunkStart) + viewportPosition / pxPerUnit;
  }

  /**
   * Converts a value from timeline units to pixels.
   *
   * @param value The value in timeline units.
   * @returns The value converted to pixels.
   */
  unitToPx(value: number): number {
    const pxPerUnit = this.viewport.select((state) => state.pxPerUnit);
    return value * pxPerUnit;
  }

  /**
   * Converts a value from pixels to timeline units.
   *
   * @param value The value in pixels.
   * @returns The value converted to timeline units.
   */
  pxToUnit(value: number): number {
    const pxPerUnit = this.viewport.select((state) => state.pxPerUnit);
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
    const viewportWidthPx = this.viewport.select((state) => state.widthPx);
    const chunkSize = Math.max(2, this.options.chunkSize ?? 2);
    return chunkSize * viewportWidthPx;
  }

  /**
   * Gets the current zoom level of the timeline.
   *
   * @returns The zoom level as a normalized value between 0 and 1.
   */
  getZoomLevel(): number {
    const min = this.getViewport().getMinVisibleRange();
    const max = this.getViewport().getMaxVisibleRange();
    const visibleRange = this.viewport.select((s) => s.visibleRange);
    return (max - visibleRange) / (max - min);
  }

  /**
   * Gets the currently visible range on the timeline in units.
   * (unit at the start and end of the visible range)
   *
   * @returns An object containing the start and end of the visible range in units.
   */
  getBounds(): { start: number; end: number } {
    const current = this.store.select((s) => s.current);
    const visibleRange = this.viewport.select((s) => s.visibleRange);
    return {
      start: current,
      end: current + visibleRange,
    };
  }

  /**
   * Gets the range of a chunk in units.
   * (how many units are in a chunk)
   *
   * @returns The chunk range in units.
   */
  getChunkRange(): number {
    return this.store.select((s) => s.chunkDuration);
  }

  /**
   * Gets the visible range of the timeline in units.
   * (how many units are visible in the viewport)
   *
   * @returns The visible range in units.
   */
  getVisibleRange(): number {
    return this.viewport.select((s) => s.visibleRange);
  }

  /**
   * Sets the visible range of the timeline in units.
   *
   * @param visibleRange The visible range to set.
   */
  setVisibleRange(visibleRange: number) {
    const clampedVisibleRange = Math.max(
      this.getViewport().getMinVisibleRange(),
      Math.min(this.getViewport().getMaxVisibleRange(), visibleRange),
    );
    this.viewport.setVisibleRange(clampedVisibleRange);
  }

  /**
   * Subscribes to changes in the viewport and updates the current chunk accordingly.
   *
   * @private
   */
  private subscribeToViewportChanges(): void {
    this.viewport.subscribe(({ widthPx, visibleRange, pxPerUnit }) => {
      const chunkSize = Math.max(2, this.options.chunkSize ?? 2);

      const { index, start } = computeChunk(
        this.store.select((state) => state.current),
        pxPerUnit,
        (chunkSize - 1) * widthPx,
      );

      this.store.update((prev) => ({
        ...prev,
        chunkIndex: index,
        chunkStart: start,
        chunkDuration: visibleRange * chunkSize,
      }));
    });
  }
}
