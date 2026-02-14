import { Store } from "@ptl/store";

import type { EntityId, MarkerType, TimelineMarker } from "./types";
import { generateId } from "./utils";

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
// Marker Module
// ============================================================================

/**
 * Module for managing timeline markers.
 * Handles CRUD operations and selection for markers.
 */
export class MarkerModule {
  private readonly store: Store<MarkerModuleState>;

  constructor() {
    this.store = new Store<MarkerModuleState>(createInitialState());
  }

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

    return marker;
  }

  /**
   * Removes a marker by ID.
   */
  remove(markerId: EntityId): TimelineMarker | null {
    const { markers, selectedMarkerIds } = this.getState();
    const marker = markers.find((m) => m.id === markerId);
    if (!marker) return null;

    const newSelectedIds = new Set(selectedMarkerIds);
    newSelectedIds.delete(markerId);

    this.store.set({
      markers: markers.filter((m) => m.id !== markerId),
      selectedMarkerIds: newSelectedIds,
    });

    return marker;
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
