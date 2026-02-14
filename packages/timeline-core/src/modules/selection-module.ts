import { Store } from "@ptl/store";

import { type TimelineApi } from "../timeline";
import { type TimelineModule } from "../timeline-module";

export type SelectionState = {
  selectedIds: Set<string>;
};

export type SelectionApi = {
  getStore(): Store<SelectionState>;
  isSelected(id: string): boolean;
  select(id: string): void;
  deselect(id: string): void;
  clearSelection(): void;
};

/**
 * Module for managing selection state within a timeline.
 */
export class SelectionModule implements TimelineModule<SelectionApi> {
  static id = "SelectionModule";

  private readonly store: Store<SelectionState>;

  constructor() {
    this.store = new Store<SelectionState>({
      selectedIds: new Set<string>(),
    });
  }

  // Static Methods

  /**
   * Gets the SelectionModule instance from the given TimelineApi.
   * @param timeline
   */
  static for(timeline: TimelineApi): SelectionModule {
    return timeline.getModule(this);
  }

  // Lifecycle Methods

  attach(_timeline: TimelineApi): void {}
  detach(): void {}

  // API Methods

  /**
   * Gets the store managing the selection state.
   * @return The store instance.
   */
  getStore(): Store<SelectionState> {
    return this.store;
  }

  /**
   * Checks if the given ID is selected.
   * @param id - The ID to check.
   * @return True if the ID is selected, false otherwise.
   */
  isSelected(id: string): boolean {
    return this.store.select((state) => state.selectedIds.has(id));
  }

  /**
   * Selects the given ID.
   * @param id - The ID to select.
   */
  select(id: string): void {
    this.store.update((state) => {
      state.selectedIds.add(id);
    });
  }

  /**
   * Deselects the given ID.
   * @param id - The ID to deselect.
   */
  deselect(id: string): void {
    this.store.update((state) => {
      state.selectedIds.delete(id);
    });
  }

  /**
   * Clears all selections.
   */
  clearSelection(): void {
    this.store.update((state) => {
      state.selectedIds.clear();
    });
  }
}
