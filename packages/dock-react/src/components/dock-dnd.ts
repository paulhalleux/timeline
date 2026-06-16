import type { DockedPlacement } from "@ptl/dock-core";

/**
 * Payload attached to dock drop zones.
 *
 * Toolbar buttons and other draggable dock affordances use this shape to
 * move a tool window to a placement, optionally before a specific item index.
 *
 * @example
 * ```ts
 * const data: DockDropData = {
 *   placement: "right-bottom",
 *   index: 0,
 * };
 * ```
 */
export interface DockDropData {
  placement: DockedPlacement;
  index?: number;
}
