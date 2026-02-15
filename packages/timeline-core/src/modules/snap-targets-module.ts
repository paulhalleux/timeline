import { Store } from "@ptl/store";

import { type TimelineApi } from "../timeline";
import { type TimelineModule } from "../timeline-module";

export type SnapTarget = {
  id: string;
  type: string;
  time: number;
};

export type SnapTargetsState = {
  idToTypeMap: Record<string, string>;
  targets: Record<string, Map<string, SnapTarget>>;
};

export type SnapTargetsApi = {
  getStore(): Store<SnapTargetsState>;
  getTargets(): SnapTarget[];
  getTargetsByType(type: string): SnapTarget[];
  setTargets(targets: SnapTarget[]): void;
  removeTarget(id: string): void;
  removeTargetsBy(predicate: (target: SnapTarget) => boolean): void;
  removeTargetsByType(type: string): void;
  addTarget(target: SnapTarget): void;
  hasTarget(id: string): boolean;
  getTarget(id: string): SnapTarget | null;
  getClosestTarget(time: number, type?: string): SnapTarget | null;
};

export class SnapTargetsModule implements TimelineModule<SnapTargetsApi> {
  static id = "SnapTargetsModule";

  private readonly store: Store<SnapTargetsState>;

  constructor() {
    this.store = new Store<SnapTargetsState>({
      idToTypeMap: {},
      targets: {},
    });
  }

  // Static Methods

  /**
   * Gets the SnapTargetsModule instance from the given TimelineApi.
   * @param timeline
   */
  static for(timeline: TimelineApi): SnapTargetsModule {
    return timeline.getModule(this);
  }

  // Lifecycle Methods

  attach(): void {}
  detach(): void {}

  // API Methods

  /**
   * Gets the store managing the snap targets state.
   * @return The store instance.
   */
  getStore(): Store<SnapTargetsState> {
    return this.store;
  }

  /**
   * Gets all snap targets.
   * @return An array of all snap targets.
   */
  getTargets(): SnapTarget[] {
    return this.store.select((state) =>
      Object.values(state.targets).flatMap((typeMap) =>
        Array.from(typeMap.values()),
      ),
    );
  }

  /**
   * Gets snap targets of a specific type.
   * @param type - The type of snap targets to retrieve.
   * @return An array of snap targets of the specified type.
   */
  getTargetsByType(type: string): SnapTarget[] {
    return this.store.select((state) => {
      const typeMap = state.targets[type];
      return typeMap ? Array.from(typeMap.values()) : [];
    });
  }

  /**
   * Sets the snap targets, replacing any existing targets.
   * @param targets - An array of snap targets to set.
   */
  setTargets(targets: SnapTarget[]): void {
    this.store.update(() => {
      const newIdToTypeMap: Record<string, string> = {};
      const newTargets: Record<string, Map<string, SnapTarget>> = {};

      for (const target of targets) {
        newIdToTypeMap[target.id] = target.type;
        if (!newTargets[target.type]) {
          newTargets[target.type] = new Map<string, SnapTarget>();
        }
        newTargets[target.type].set(target.id, target);
      }

      return {
        idToTypeMap: newIdToTypeMap,
        targets: newTargets,
      };
    });
  }

  /**
   * Removes a snap target by its ID.
   * @param id - The ID of the snap target to remove.
   */
  removeTarget(id: string): void {
    this.store.update((state) => {
      const type = state.idToTypeMap[id];
      if (type) {
        delete state.idToTypeMap[id];
        state.targets[type]?.delete(id);
      }
    });
  }

  /**
   * Removes snap targets that match a given predicate function.
   * @param predicate - A function that takes a snap target and returns true if it should be removed.
   */
  removeTargetsBy(predicate: (target: SnapTarget) => boolean): void {
    this.store.update((state) => {
      for (const type in state.targets) {
        const typeMap = state.targets[type];
        for (const [id, target] of typeMap.entries()) {
          if (predicate(target)) {
            delete state.idToTypeMap[id];
            typeMap.delete(id);
          }
        }
      }
    });
  }

  /**
   * Removes all snap targets of a specific type.
   * @param type - The type of snap targets to remove.
   */
  removeTargetsByType(type: string): void {
    this.store.update((state) => {
      const typeMap = state.targets[type];
      if (typeMap) {
        for (const id of typeMap.keys()) {
          delete state.idToTypeMap[id];
        }
        delete state.targets[type];
      }
    });
  }

  /**
   * Adds a new snap target.
   * @param target - The snap target to add.
   */
  addTarget(target: SnapTarget): void {
    this.store.update((state) => {
      state.idToTypeMap[target.id] = target.type;
      if (!state.targets[target.type]) {
        state.targets[target.type] = new Map<string, SnapTarget>();
      }
      state.targets[target.type].set(target.id, target);
    });
  }

  /**
   * Checks if a snap target with the given ID exists.
   * @param id - The ID to check for existence.
   * @return True if a snap target with the given ID exists, false otherwise.
   */
  hasTarget(id: string): boolean {
    return this.store.select((state) => id in state.idToTypeMap);
  }

  /**
   * Gets a snap target by its ID.
   * @param id - The ID of the snap target to retrieve.
   * @return The snap target with the given ID, or null if it does not exist.
   */
  getTarget(id: string): SnapTarget | null {
    return this.store.select((state) => {
      const type = state.idToTypeMap[id];
      return type ? state.targets[type]?.get(id) || null : null;
    });
  }

  /**
   * Gets the closest snap target to a given time, optionally filtered by type.
   * @param time - The time to find the closest snap target to.
   * @param type - Optional type to filter snap targets by.
   * @return The closest snap target, or null if no targets are found.
   */
  getClosestTarget(time: number, type?: string): SnapTarget | null {
    return this.store.select((state) => {
      let closestTarget: SnapTarget | null = null;
      let closestDistance = Infinity;

      const typesToSearch = type ? [type] : Object.keys(state.targets);
      for (const t of typesToSearch) {
        const typeMap = state.targets[t];
        if (typeMap) {
          for (const target of typeMap.values()) {
            const distance = Math.abs(target.time - time);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestTarget = target;
            }
          }
        }
      }

      return closestTarget;
    });
  }
}
