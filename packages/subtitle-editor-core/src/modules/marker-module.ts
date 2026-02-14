import { Store } from "@ptl/modular-core";

import type { EditorModule } from "../editor-module";
import type { EntityId, MarkerType, TimelineMarker } from "../types";
import { generateId } from "../utils";
import type { HistoryModule } from "./history-module";

// ============================================================================
// Marker Module Options
// ============================================================================

export interface MarkerModuleOptions {
  /** Optional history module for auto-recording changes */
  history?: HistoryModule | null;
}

// ============================================================================
// Marker Module State
// ============================================================================

export interface MarkerModuleState {
  markers: TimelineMarker[];
  selectedMarkerIds: Set<EntityId>;
}

const createInitialState = (): MarkerModuleState => ({
  markers: [],
  selectedMarkerIds: new Set(),
});

// ============================================================================
// Marker Module API
// ============================================================================

export interface MarkerModuleApi {
  getStore(): Store<MarkerModuleState>;
  getState(): MarkerModuleState;
  getMarkers(): TimelineMarker[];
  getSelectedIds(): Set<EntityId>;
  add(
    time: number,
    type?: MarkerType,
    label?: string,
    color?: string,
  ): TimelineMarker;
  remove(markerId: EntityId): TimelineMarker | null;
  get(markerId: EntityId): TimelineMarker | undefined;
  update(
    markerId: EntityId,
    updates: Partial<Omit<TimelineMarker, "id">>,
  ): void;
  getInRange(startTime: number, endTime: number): TimelineMarker[];
  getByType(type: MarkerType): TimelineMarker[];
  getNearest(
    time: number,
    direction?: "before" | "after",
  ): TimelineMarker | null;
  select(markerId: EntityId, addToSelection?: boolean): void;
  deselect(markerId: EntityId): void;
  toggleSelection(markerId: EntityId): void;
  clearSelection(): void;
  selectAll(): void;
  getSelected(): TimelineMarker[];
  isSelected(markerId: EntityId): boolean;
  removeSelected(): TimelineMarker[];
  clear(): void;
  destroy(): void;
}

// ============================================================================
// Marker Module
// ============================================================================

/**
 * Module for managing timeline markers.
 * Handles CRUD operations and selection for markers.
 */
export class MarkerModule implements EditorModule<MarkerModuleApi> {
  static id = "MarkerModule";

  private readonly store: Store<MarkerModuleState>;
  private readonly history: HistoryModule | null;

  constructor(options: MarkerModuleOptions = {}) {
    this.store = new Store<MarkerModuleState>(createInitialState());
    this.history = options.history ?? null;
  }

  // Static Methods

  static for(editor: {
    getModule: (m: typeof MarkerModule) => MarkerModule;
  }): MarkerModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(): void {}
  detach(): void {}

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<MarkerModuleState> {
    return this.store;
  }

  getState(): MarkerModuleState {
    return this.store.get();
  }

  getMarkers(): TimelineMarker[] {
    return this.getState().markers;
  }

  getSelectedIds(): Set<EntityId> {
    return this.getState().selectedMarkerIds;
  }

  // ---------------------------------------------------------------------------
  // Marker CRUD
  // ---------------------------------------------------------------------------

  /**
   * Adds a marker at the specified time.
   */
  add(
    time: number,
    type: MarkerType = "bookmark",
    label?: string,
    color?: string,
  ): TimelineMarker {
    const marker: TimelineMarker = {
      id: generateId("marker"),
      time,
      type,
      label,
      color,
    };

    const { markers, selectedMarkerIds } = this.getState();
    this.store.set({
      markers: [...markers, marker].sort((a, b) => a.time - b.time),
      selectedMarkerIds,
    });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      const markerId = marker.id;
      this.history.record({
        type: "marker:add",
        description: `Add marker at ${time}ms`,
        undo: () => this.removeInternal(markerId),
        redo: () => this.addInternal(marker),
      });
    }

    return marker;
  }

  /**
   * Internal add that doesn't record to history.
   */
  private addInternal(marker: TimelineMarker): void {
    const { markers, selectedMarkerIds } = this.getState();
    this.store.set({
      markers: [...markers, marker].sort((a, b) => a.time - b.time),
      selectedMarkerIds,
    });
  }

  /**
   * Removes a marker by ID.
   */
  remove(markerId: EntityId): TimelineMarker | null {
    const { markers, selectedMarkerIds } = this.getState();
    const marker = markers.find((m) => m.id === markerId);
    if (!marker) return null;

    // Capture marker data for history
    const markerData = { ...marker };

    const newSelectedIds = new Set(selectedMarkerIds);
    newSelectedIds.delete(markerId);

    this.store.set({
      markers: markers.filter((m) => m.id !== markerId),
      selectedMarkerIds: newSelectedIds,
    });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "marker:remove",
        description: `Remove marker`,
        undo: () => this.addInternal(markerData),
        redo: () => this.removeInternal(markerId),
      });
    }

    return marker;
  }

  /**
   * Internal remove that doesn't record to history.
   */
  private removeInternal(markerId: EntityId): void {
    const { markers, selectedMarkerIds } = this.getState();
    const newSelectedIds = new Set(selectedMarkerIds);
    newSelectedIds.delete(markerId);
    this.store.set({
      markers: markers.filter((m) => m.id !== markerId),
      selectedMarkerIds: newSelectedIds,
    });
  }

  /**
   * Gets a marker by ID.
   */
  get(markerId: EntityId): TimelineMarker | undefined {
    return this.getState().markers.find((m) => m.id === markerId);
  }

  /**
   * Updates a marker.
   */
  update(
    markerId: EntityId,
    updates: Partial<Omit<TimelineMarker, "id">>,
  ): void {
    const { markers, selectedMarkerIds } = this.getState();
    const marker = markers.find((m) => m.id === markerId);
    if (!marker) return;

    // Capture old values for history
    const oldValues: Partial<Omit<TimelineMarker, "id">> = {};
    for (const key of Object.keys(updates) as Array<keyof typeof updates>) {
      oldValues[key] = marker[key] as never;
    }

    const needsSort = updates.time !== undefined;

    let newMarkers = markers.map((m) =>
      m.id === markerId ? { ...m, ...updates } : m,
    );

    if (needsSort) {
      newMarkers = newMarkers.sort((a, b) => a.time - b.time);
    }

    this.store.set({
      markers: newMarkers,
      selectedMarkerIds,
    });

    // Auto-record to history
    if (this.history && !this.history.isUndoingOrRedoing()) {
      this.history.record({
        type: "marker:update",
        description: `Update marker`,
        undo: () => this.updateInternal(markerId, oldValues),
        redo: () => this.updateInternal(markerId, updates),
      });
    }
  }

  /**
   * Internal update that doesn't record to history.
   */
  private updateInternal(
    markerId: EntityId,
    updates: Partial<Omit<TimelineMarker, "id">>,
  ): void {
    const { markers, selectedMarkerIds } = this.getState();
    const needsSort = updates.time !== undefined;

    let newMarkers = markers.map((m) =>
      m.id === markerId ? { ...m, ...updates } : m,
    );

    if (needsSort) {
      newMarkers = newMarkers.sort((a, b) => a.time - b.time);
    }

    this.store.set({
      markers: newMarkers,
      selectedMarkerIds,
    });
  }

  /**
   * Gets markers within a time range.
   */
  getInRange(startTime: number, endTime: number): TimelineMarker[] {
    return this.getState().markers.filter(
      (m) => m.time >= startTime && m.time <= endTime,
    );
  }

  /**
   * Gets markers of a specific type.
   */
  getByType(type: MarkerType): TimelineMarker[] {
    return this.getState().markers.filter((m) => m.type === type);
  }

  /**
   * Gets the nearest marker to a given time.
   */
  getNearest(
    time: number,
    direction?: "before" | "after",
  ): TimelineMarker | null {
    const markers = this.getState().markers;
    if (markers.length === 0) return null;

    if (direction === "before") {
      const before = markers.filter((m) => m.time < time);
      return before.length > 0 ? before[before.length - 1] : null;
    }

    if (direction === "after") {
      return markers.find((m) => m.time > time) ?? null;
    }

    // Find absolute nearest
    let nearest = markers[0];
    let minDist = Math.abs(markers[0].time - time);

    for (const marker of markers) {
      const dist = Math.abs(marker.time - time);
      if (dist < minDist) {
        minDist = dist;
        nearest = marker;
      }
    }

    return nearest;
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  /**
   * Selects a marker.
   */
  select(markerId: EntityId, addToSelection = false): void {
    const { markers, selectedMarkerIds } = this.getState();
    const newSelectedIds = addToSelection
      ? new Set(selectedMarkerIds)
      : new Set<EntityId>();
    newSelectedIds.add(markerId);

    this.store.set({
      markers,
      selectedMarkerIds: newSelectedIds,
    });
  }

  /**
   * Deselects a marker.
   */
  deselect(markerId: EntityId): void {
    const { markers, selectedMarkerIds } = this.getState();
    const newSelectedIds = new Set(selectedMarkerIds);
    newSelectedIds.delete(markerId);

    this.store.set({
      markers,
      selectedMarkerIds: newSelectedIds,
    });
  }

  /**
   * Toggles marker selection.
   */
  toggleSelection(markerId: EntityId): void {
    const { selectedMarkerIds } = this.getState();
    if (selectedMarkerIds.has(markerId)) {
      this.deselect(markerId);
    } else {
      this.select(markerId, true);
    }
  }

  /**
   * Clears marker selection.
   */
  clearSelection(): void {
    const { markers } = this.getState();
    this.store.set({
      markers,
      selectedMarkerIds: new Set(),
    });
  }

  /**
   * Selects all markers.
   */
  selectAll(): void {
    const { markers } = this.getState();
    this.store.set({
      markers,
      selectedMarkerIds: new Set(markers.map((m) => m.id)),
    });
  }

  /**
   * Gets selected markers.
   */
  getSelected(): TimelineMarker[] {
    const { markers, selectedMarkerIds } = this.getState();
    return markers.filter((m) => selectedMarkerIds.has(m.id));
  }

  /**
   * Checks if a marker is selected.
   */
  isSelected(markerId: EntityId): boolean {
    return this.getState().selectedMarkerIds.has(markerId);
  }

  /**
   * Removes selected markers.
   */
  removeSelected(): TimelineMarker[] {
    const selected = this.getSelected();
    const { markers } = this.getState();

    this.store.set({
      markers: markers.filter((m) => !this.isSelected(m.id)),
      selectedMarkerIds: new Set(),
    });

    return selected;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Clears all markers.
   */
  clear(): void {
    this.store.set(createInitialState());
  }

  /**
   * Destroys the module.
   */
  destroy(): void {
    this.clear();
  }
}
