import { Store } from "@ptl/store";

import type { EntityId, SelectableEntityType } from "./types";

// ============================================================================
// Selection Module State
// ============================================================================

export interface SelectionModuleState {
  /** Currently active track ID */
  activeTrackId: EntityId | null;
  /** Selected cue indices per track */
  selectedCues: Map<EntityId, Set<number>>;
  /** Primary selection type (most recently selected) */
  primarySelectionType: SelectableEntityType | null;
}

const createInitialState = (): SelectionModuleState => ({
  activeTrackId: null,
  selectedCues: new Map(),
  primarySelectionType: null,
});

// ============================================================================
// Selection Module
// ============================================================================

/**
 * Module for managing selection state.
 * Handles track activation and cue selection.
 * Marker selection is handled by MarkerModule directly.
 */
export class SelectionModule {
  private store: Store<SelectionModuleState>;

  constructor() {
    this.store = new Store<SelectionModuleState>(createInitialState());
  }

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<SelectionModuleState> {
    return this.store;
  }

  getState(): SelectionModuleState {
    return this.store.get();
  }

  // ---------------------------------------------------------------------------
  // Active Track
  // ---------------------------------------------------------------------------

  /**
   * Gets the active track ID.
   */
  getActiveTrackId(): EntityId | null {
    return this.getState().activeTrackId;
  }

  /**
   * Sets the active track.
   */
  setActiveTrack(trackId: EntityId | null): void {
    const state = this.getState();
    this.store.set({
      ...state,
      activeTrackId: trackId,
    });
  }

  // ---------------------------------------------------------------------------
  // Cue Selection
  // ---------------------------------------------------------------------------

  /**
   * Gets selected cue indices for a track.
   */
  getSelectedCues(trackId: EntityId): Set<number> {
    return this.getState().selectedCues.get(trackId) ?? new Set();
  }

  /**
   * Gets all selected cues across all tracks.
   */
  getAllSelectedCues(): Map<EntityId, Set<number>> {
    return new Map(this.getState().selectedCues);
  }

  /**
   * Selects a cue.
   */
  selectCue(trackId: EntityId, cueIndex: number, addToSelection = false): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);

    const trackSelection = addToSelection
      ? new Set(selectedCues.get(trackId) ?? [])
      : new Set<number>();

    trackSelection.add(cueIndex);
    selectedCues.set(trackId, trackSelection);

    // Clear selections in other tracks if not adding to selection
    if (!addToSelection) {
      for (const key of selectedCues.keys()) {
        if (key !== trackId) {
          selectedCues.delete(key);
        }
      }
    }

    this.store.set({
      ...state,
      selectedCues,
      primarySelectionType: "cue",
    });
  }

  /**
   * Selects a range of cues (for shift+click).
   */
  selectCueRange(
    trackId: EntityId,
    startIndex: number,
    endIndex: number,
    addToSelection = false,
  ): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);

    const trackSelection = addToSelection
      ? new Set(selectedCues.get(trackId) ?? [])
      : new Set<number>();

    const [min, max] =
      startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    for (let i = min; i <= max; i++) {
      trackSelection.add(i);
    }

    selectedCues.set(trackId, trackSelection);

    this.store.set({
      ...state,
      selectedCues,
      primarySelectionType: "cue",
    });
  }

  /**
   * Deselects a cue.
   */
  deselectCue(trackId: EntityId, cueIndex: number): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);
    const trackSelection = new Set(selectedCues.get(trackId) ?? []);

    trackSelection.delete(cueIndex);

    if (trackSelection.size === 0) {
      selectedCues.delete(trackId);
    } else {
      selectedCues.set(trackId, trackSelection);
    }

    this.store.set({
      ...state,
      selectedCues,
    });
  }

  /**
   * Toggles cue selection.
   */
  toggleCueSelection(trackId: EntityId, cueIndex: number): void {
    const trackSelection = this.getSelectedCues(trackId);
    if (trackSelection.has(cueIndex)) {
      this.deselectCue(trackId, cueIndex);
    } else {
      this.selectCue(trackId, cueIndex, true);
    }
  }

  /**
   * Checks if a cue is selected.
   */
  isCueSelected(trackId: EntityId, cueIndex: number): boolean {
    return this.getSelectedCues(trackId).has(cueIndex);
  }

  /**
   * Clears cue selection for a track or all tracks.
   */
  clearCueSelection(trackId?: EntityId): void {
    const state = this.getState();

    if (trackId) {
      const selectedCues = new Map(state.selectedCues);
      selectedCues.delete(trackId);
      this.store.set({
        ...state,
        selectedCues,
      });
    } else {
      this.store.set({
        ...state,
        selectedCues: new Map(),
      });
    }
  }

  /**
   * Selects all cues in a track.
   */
  selectAllCues(trackId: EntityId, cueCount: number): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);
    const trackSelection = new Set<number>();

    for (let i = 0; i < cueCount; i++) {
      trackSelection.add(i);
    }

    selectedCues.set(trackId, trackSelection);

    this.store.set({
      ...state,
      selectedCues,
      primarySelectionType: "cue",
    });
  }

  // ---------------------------------------------------------------------------
  // General Selection
  // ---------------------------------------------------------------------------

  /**
   * Gets the primary selection type.
   */
  getPrimarySelectionType(): SelectableEntityType | null {
    return this.getState().primarySelectionType;
  }

  /**
   * Clears all selections.
   */
  clearAll(): void {
    this.store.set(createInitialState());
  }

  /**
   * Called when a track is removed to clean up selection state.
   */
  onTrackRemoved(trackId: EntityId): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);
    selectedCues.delete(trackId);

    let activeTrackId = state.activeTrackId;
    if (activeTrackId === trackId) {
      activeTrackId = null;
    }

    this.store.set({
      ...state,
      activeTrackId,
      selectedCues,
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Destroys the module.
   */
  destroy(): void {
    this.store.set(createInitialState());
  }
}
