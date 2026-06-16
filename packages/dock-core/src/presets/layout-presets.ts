import {
  PlatformError,
  disposable,
  type ContributionOwner,
  type Disposable,
  type LocalizedText,
} from "@ptl/platform-core";

import type {
  DockedPlacement,
  DockRegion,
  DockState,
  WorkspaceItemState,
} from "../layout-state";
import { dockErrorCodes } from "../errors";
import {
  DockStateStore,
} from "../state/dock-store";
import type { DockStateStoreOptions } from "../state/dock-api";

/**
 * Immutable builder used by layout presets.
 *
 * Presets call store-shaped methods and receive a new builder for each change,
 * which keeps preset application predictable without exposing action objects.
 *
 * @example
 * ```ts
 * const next = builder
 *   .showToolWindow("outline")
 *   .moveToolWindow("outline", "left-top");
 * ```
 */
export interface DockLayoutBuilder {
  readonly state: DockState;
  showToolWindow(toolWindowId: string): DockLayoutBuilder;
  hideToolWindow(toolWindowId: string): DockLayoutBuilder;
  toggleToolWindow(toolWindowId: string): DockLayoutBuilder;
  moveToolWindow(
    toolWindowId: string,
    placement: DockedPlacement,
    index?: number,
  ): DockLayoutBuilder;
  resize(placement: DockedPlacement, size: number): DockLayoutBuilder;
  resizeRegion(region: DockRegion, size: number): DockLayoutBuilder;
  openWorkspaceItem(item: WorkspaceItemState): DockLayoutBuilder;
  closeWorkspaceItem(itemId: string): DockLayoutBuilder;
  activateWorkspaceItem(itemId: string): DockLayoutBuilder;
}

/**
 * Contribution metadata for a named dock layout preset.
 *
 * @example
 * ```ts
 * presets.register({
 *   id: "review",
 *   title: "Review",
 *   apply: (builder) => builder.showToolWindow("comments"),
 * });
 * ```
 */
export interface LayoutPresetContribution {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  owner?: ContributionOwner;
  apply(builder: DockLayoutBuilder): DockLayoutBuilder;
}

/**
 * Immutable implementation of `DockLayoutBuilder`.
 *
 * Each method creates a short-lived `DockStateStore`, calls the matching
 * store API, and returns a new builder with the resulting state. That keeps
 * presets store-shaped without mutating the source builder.
 *
 * @example
 * ```ts
 * const next = new DockStateBuilder(state)
 *   .openWorkspaceItem(item)
 *   .resizeRegion("bottom", 30);
 * ```
 */
export class DockStateBuilder implements DockLayoutBuilder {
  constructor(
    readonly state: DockState,
    private readonly options: Omit<DockStateStoreOptions, "initialState"> = {},
  ) {}

  showToolWindow(toolWindowId: string): DockLayoutBuilder {
    return this.apply((store) => store.showToolWindow(toolWindowId));
  }

  hideToolWindow(toolWindowId: string): DockLayoutBuilder {
    return this.apply((store) => store.hideToolWindow(toolWindowId));
  }

  toggleToolWindow(toolWindowId: string): DockLayoutBuilder {
    return this.apply((store) => store.toggleToolWindow(toolWindowId));
  }

  moveToolWindow(
    toolWindowId: string,
    placement: DockedPlacement,
    index?: number,
  ): DockLayoutBuilder {
    return this.apply((store) => store.moveToolWindow(toolWindowId, placement, index));
  }

  resize(placement: DockedPlacement, size: number): DockLayoutBuilder {
    return this.apply((store) => store.resize(placement, size));
  }

  resizeRegion(region: DockRegion, size: number): DockLayoutBuilder {
    return this.apply((store) => store.resizeRegion(region, size));
  }

  openWorkspaceItem(item: WorkspaceItemState): DockLayoutBuilder {
    return this.apply((store) => store.openWorkspaceItem(item));
  }

  closeWorkspaceItem(itemId: string): DockLayoutBuilder {
    return this.apply((store) => store.closeWorkspaceItem(itemId));
  }

  activateWorkspaceItem(itemId: string): DockLayoutBuilder {
    return this.apply((store) => store.activateWorkspaceItem(itemId));
  }

  private apply(change: (store: DockStateStore) => void): DockLayoutBuilder {
    const store = new DockStateStore({ ...this.options, initialState: this.state });
    change(store);
    return new DockStateBuilder(store.getState(), this.options);
  }
}

/**
 * Registry for generic dock layout presets.
 *
 * Presets describe workflows through store-like builder methods. They do not
 * contain subtitle-specific assumptions, component implementations, or UI state.
 */
export class LayoutPresetRegistry {
  private readonly presets = new Map<string, LayoutPresetContribution>();

  register(contribution: LayoutPresetContribution): Disposable {
    if (this.presets.has(contribution.id)) {
      throw new PlatformError({
        code: dockErrorCodes.presetAlreadyRegistered,
        message: `Layout preset "${contribution.id}" is already registered`,
        details: { id: contribution.id },
      });
    }

    this.presets.set(contribution.id, contribution);

    return disposable(() => {
      if (this.presets.get(contribution.id) === contribution) {
        this.presets.delete(contribution.id);
      }
    });
  }

  get(id: string): LayoutPresetContribution | undefined {
    return this.presets.get(id);
  }

  getAll(): LayoutPresetContribution[] {
    return [...this.presets.values()];
  }

  apply(
    id: string,
    state: DockState,
    options: Omit<DockStateStoreOptions, "initialState"> = {},
  ): DockState {
    const preset = this.presets.get(id);

    if (!preset) {
      throw new PlatformError({
        code: dockErrorCodes.presetMissing,
        message: `Layout preset "${id}" is not registered`,
        details: { id },
      });
    }

    return preset.apply(new DockStateBuilder(state, options)).state;
  }
}
