import type { DockedPlacement, DockApi, DockState } from "@ptl/dock-core";

/**
 * Side placements rendered in the left JetBrains-style rail.
 *
 * The first entry is the upper stack, the second is the lower stack below the
 * separator when both groups are present.
 */
export const leftPlacements: readonly DockedPlacement[] = ["left-top", "left-bottom"];

/**
 * Side placements rendered in the right JetBrains-style rail.
 *
 * The order mirrors the left rail so resizing and rendering logic can share the
 * same placement-stack helpers.
 */
export const rightPlacements: readonly DockedPlacement[] = ["right-top", "right-bottom"];

/**
 * Bottom placements rendered under the central workspace.
 *
 * These placements split horizontally and sit below the side rails rather than
 * inside the left or right vertical toolbar groups.
 */
export const bottomPlacements: readonly DockedPlacement[] = ["bottom-left", "bottom-right"];

/**
 * Stable panel id for the root main area in `react-resizable-panels`.
 *
 * This id is used as a key in persisted layout maps, so it should remain stable
 * across package versions.
 */
export const mainPanelId = "dock-main";

/**
 * Stable panel id for the central workspace in `react-resizable-panels`.
 *
 * The workspace panel receives the remaining width after visible side regions
 * have been sized.
 */
export const workspacePanelId = "dock-workspace";

/**
 * Stable panel id for the left tool-window region.
 *
 * This region is omitted entirely when no visible left placements exist.
 */
export const leftRegionPanelId = "dock-left";

/**
 * Stable panel id for the right tool-window region.
 *
 * This region is omitted entirely when no visible right placements exist.
 */
export const rightRegionPanelId = "dock-right";

/**
 * Stable panel id for the bottom tool-window region.
 *
 * This region is omitted entirely when no visible bottom placements exist.
 */
export const bottomRegionPanelId = "dock-bottom";

/**
 * Default percent width for side regions when no persisted value exists.
 *
 * The value is intentionally conservative so the workspace remains the dominant
 * surface on first render.
 */
const defaultSideSize = 20;

/**
 * Default percent height for the bottom region when no persisted value exists.
 *
 * The bottom region needs enough room for timelines and consoles without
 * swallowing the editor workspace.
 */
const defaultBottomSize = 22;

/**
 * Default percent split between top and bottom slots inside a side region.
 *
 * Equal split is used only when both side placements contain visible items.
 */
export const defaultSideSplitSize = 50;

/**
 * Default percent split between left and right slots inside the bottom region.
 *
 * Equal split keeps bottom-left and bottom-right panels balanced until the user
 * resizes them.
 */
export const defaultBottomSplitSize = 50;

/**
 * Return placements that currently have an active tool window to display.
 *
 * A placement with items but no `activeItemId` is treated as collapsed, which
 * causes the entire region panel to disappear until a tool is reactivated.
 *
 * @example
 * ```ts
 * const visible = getVisiblePlacements(state, leftPlacements);
 * ```
 */
export function getVisiblePlacements(
  state: Pick<DockState, "placements">,
  placements: readonly DockedPlacement[],
) {
  return placements.filter((placement) => !!state.placements[placement].activeItemId);
}

/**
 * Build the root vertical layout with an optional bottom tool region.
 *
 * @example
 * ```ts
 * const layout = createRootLayout(state, true);
 * ```
 */
export function createRootLayout(
  state: Pick<DockState, "sizes">,
  hasBottomTools: boolean,
): Record<string, number> {
  if (!hasBottomTools) {
    return { [mainPanelId]: 100 };
  }

  const bottomSize = clampPercent(state.sizes.regions.bottom ?? defaultBottomSize);
  return {
    [mainPanelId]: 100 - bottomSize,
    [bottomRegionPanelId]: bottomSize,
  };
}

/**
 * Build the main horizontal layout with optional left and right tool regions.
 *
 * @param state - Dock state containing persisted region sizes.
 * @param hasLeftTools - Whether the left region should be present.
 * @param hasRightTools - Whether the right region should be present.
 * @returns Panel sizes keyed by panel id for `react-resizable-panels`.
 */
export function createMainLayout(
  state: Pick<DockState, "sizes">,
  hasLeftTools: boolean,
  hasRightTools: boolean,
): Record<string, number> {
  const leftSize = hasLeftTools ? clampPercent(state.sizes.regions.left ?? defaultSideSize) : 0;
  const rightSize = hasRightTools ? clampPercent(state.sizes.regions.right ?? defaultSideSize) : 0;

  return {
    ...(hasLeftTools ? { [leftRegionPanelId]: leftSize } : {}),
    [workspacePanelId]: Math.max(10, 100 - leftSize - rightSize),
    ...(hasRightTools ? { [rightRegionPanelId]: rightSize } : {}),
  };
}

/**
 * Build a placement-stack layout for the slots inside one region.
 *
 * @param state - Dock state containing persisted placement sizes.
 * @param placements - Visible placements participating in the split.
 * @param fallbackSize - Size used when no persisted value exists.
 * @returns Panel sizes keyed by placement id.
 */
export function createPlacementSplitLayout(
  state: Pick<DockState, "sizes">,
  placements: readonly DockedPlacement[],
  fallbackSize: number,
): Record<string, number> {
  if (placements.length === 0) {
    return {};
  }

  if (placements.length === 1) {
    const placement = placements[0];
    return placement ? { [placement]: 100 } : {};
  }

  const firstPlacement = placements[0];
  const secondPlacement = placements[1];
  const firstSize = clampPercent(
    firstPlacement ? (state.sizes.placements[firstPlacement] ?? fallbackSize) : fallbackSize,
  );

  return {
    ...(firstPlacement ? { [firstPlacement]: firstSize } : {}),
    ...(secondPlacement ? { [secondPlacement]: 100 - firstSize } : {}),
  };
}

/**
 * Persist placement split sizes emitted by `react-resizable-panels`.
 *
 * @param dock - Dock API used to write the new sizes.
 * @param placements - Placements expected in the layout payload.
 * @param layout - Size map emitted by the panel group.
 */
export function resizePlacementSplit(
  dock: Pick<DockApi, "resize">,
  placements: readonly DockedPlacement[],
  layout: Record<string, number>,
) {
  for (const placement of placements) {
    const size = layout[placement];

    if (size !== undefined) {
      dock.resize(placement, size);
    }
  }
}

/**
 * Clamp a persisted layout value into the percent range expected by panels.
 *
 * @param value - Candidate percent value.
 * @returns A finite number between 0 and 100.
 */
function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}
