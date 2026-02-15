import { type CoreApi, Store } from "@ptl/modular-core";

import type { EditorModule } from "../editor-module";
import type { EntityId } from "../types";

// ============================================================================
// Selection Module State
// ============================================================================

export interface SelectionModuleState {
  /** Currently active track ID */
  activeTrackId: EntityId | null;
  /** Selected cue indices per track */
  selectedCues: Map<EntityId, Set<string>>;
}

const createInitialState = (): SelectionModuleState => ({
  activeTrackId: null,
  selectedCues: new Map(),
});

// ============================================================================
// Selection Module API
// ============================================================================

export interface SelectionModuleApi {
  getStore(): Store<SelectionModuleState>;
  getState(): SelectionModuleState;
  getActiveTrackId(): EntityId | null;
  setActiveTrack(trackId: EntityId | null): void;
  getSelectedCues(trackId: EntityId): Set<string>;
  getAllSelectedCues(): Map<EntityId, Set<string>>;
  selectCue(trackId: EntityId, cueId: string, addToSelection?: boolean): void;
  deselectCue(trackId: EntityId, cueId: string): void;
  toggleCueSelection(trackId: EntityId, cueId: string): void;
  isCueSelected(trackId: EntityId, cueId: string): boolean;
  clearCueSelection(trackId?: EntityId): void;
  clearAll(): void;
  onTrackRemoved(trackId: EntityId): void;
  destroy(): void;
}

// ============================================================================
// Selection Module
// ============================================================================

/**
 * Module for managing selection state.
 * Handles track activation and cue selection.
 * Marker selection is handled by MarkerModule directly.
 */
export class SelectionModule implements EditorModule<SelectionModuleApi> {
  static id = "SelectionModule";

  private readonly store: Store<SelectionModuleState>;

  constructor() {
    this.store = new Store<SelectionModuleState>(createInitialState());
  }

  // Static Methods

  static for<A>(editor: CoreApi<A>): SelectionModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(): void {}
  detach(): void {}

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
  getSelectedCues(trackId: EntityId): Set<string> {
    return this.getState().selectedCues.get(trackId) ?? new Set();
  }

  /**
   * Gets all selected cues across all tracks.
   */
  getAllSelectedCues(): Map<EntityId, Set<string>> {
    return new Map(this.getState().selectedCues);
  }

  /**
   * Selects a cue.
   */
  selectCue(trackId: EntityId, cueId: string, addToSelection = false): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);

    const trackSelection = addToSelection
      ? new Set(selectedCues.get(trackId) ?? [])
      : new Set<string>();

    trackSelection.add(cueId);
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
    });
  }

  /**
   * Deselects a cue.
   */
  deselectCue(trackId: EntityId, cueId: string): void {
    const state = this.getState();
    const selectedCues = new Map(state.selectedCues);
    const trackSelection = new Set(selectedCues.get(trackId) ?? []);

    trackSelection.delete(cueId);

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
  toggleCueSelection(trackId: EntityId, cueId: string): void {
    const trackSelection = this.getSelectedCues(trackId);
    if (trackSelection.has(cueId)) {
      this.deselectCue(trackId, cueId);
    } else {
      this.selectCue(trackId, cueId, true);
    }
  }

  /**
   * Checks if a cue is selected.
   */
  isCueSelected(trackId: EntityId, cueId: string): boolean {
    return this.getSelectedCues(trackId).has(cueId);
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

  // ---------------------------------------------------------------------------
  // General Selection
  // ---------------------------------------------------------------------------

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
