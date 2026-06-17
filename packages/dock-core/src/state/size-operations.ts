import type {
  DockedPlacement,
  DockRegion,
  DockState,
} from "../layout-state";
import {
  getToolWindowContribution,
  type ToolWindowContributionSource,
} from "../tool-windows/tool-window-contributions";

/** Persist a dock-placement split size after applying active tool constraints. */
export function resizeToolWindowPlacementState(
  state: DockState,
  placement: DockedPlacement,
  size: number,
  source?: ToolWindowContributionSource,
): DockState {
  const constrainedSize = constrainPlacementSize(state, placement, size, source);

  return {
    ...state,
    sizes: {
      ...state.sizes,
      placements: {
        ...state.sizes.placements,
        [placement]: constrainedSize,
      },
    },
  };
}

/** Persist a left, right, or bottom dock region size. */
export function resizeRegionState(
  state: DockState,
  region: DockRegion,
  size: number,
): DockState {
  if (!Number.isFinite(size)) {
    return state;
  }

  return {
    ...state,
    sizes: {
      ...state.sizes,
      regions: {
        ...state.sizes.regions,
        [region]: Math.max(0, size),
      },
    },
  };
}

function constrainPlacementSize(
  state: DockState,
  placement: DockedPlacement,
  size: number,
  source?: ToolWindowContributionSource,
): number {
  const activeItemId = state.placements[placement].activeItemId;
  const activeToolWindow = activeItemId ? state.toolWindows[activeItemId] : undefined;
  const constraints = activeToolWindow
    ? getToolWindowContribution(source, activeToolWindow.id)?.constraints
    : undefined;
  const minSize = placement.startsWith("bottom") ? constraints?.minHeight : constraints?.minWidth;

  if (!Number.isFinite(size)) {
    return state.sizes.placements[placement] ?? minSize ?? 0;
  }

  return Math.max(minSize ?? 0, size);
}
