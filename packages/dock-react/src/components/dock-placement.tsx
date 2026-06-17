import { cn } from "@ptl/ui";
import type { DockedPlacement, ToolWindowState } from "@ptl/dock-core";
import { useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { Group as PanelGroup, Panel } from "react-resizable-panels";

import { useDock, useDockState } from "../provider/dock-provider";
import { getActiveToolWindow, getPlacementToolWindows } from "../utils/layout-selectors";
import type { DockDropData } from "./dock-dnd";
import {
  createPlacementSplitLayout,
  defaultBottomSplitSize,
  defaultSideSplitSize,
  resizePlacementSplit,
} from "./dock-layout-model";
import { DockResizeHandle } from "./dock-resize-handle";
import { DockToolHeader } from "./dock-tool-header";

interface DockPlacementStackProps {
  dragAndDrop: boolean;
  groupId: string;
  placements: readonly DockedPlacement[];
  renderToolWindow?: (toolWindow: ToolWindowState) => React.ReactNode;
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
}

interface DockPlacementProps {
  dragAndDrop: boolean;
  placement: DockedPlacement;
  renderToolWindow?: (toolWindow: ToolWindowState) => React.ReactNode;
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
}

/**
 * Vertical stack for the top and bottom placements in a side dock region.
 *
 * @example
 * ```tsx
 * <DockPlacementStack groupId="left" placements={["left-top", "left-bottom"]} dragAndDrop />
 * ```
 */
export function DockPlacementStack({
  dragAndDrop,
  groupId,
  placements,
  renderToolWindow,
  renderToolWindowHeader,
}: DockPlacementStackProps) {
  const dock = useDock();
  const state = useDockState((dockState) => dockState);

  if (placements.length === 1) {
    const placement = placements[0];

    if (!placement) {
      return null;
    }

    return (
      <DockPlacement
        dragAndDrop={dragAndDrop}
        placement={placement}
        renderToolWindowHeader={renderToolWindowHeader}
        renderToolWindow={renderToolWindow}
      />
    );
  }

  return (
    <PanelGroup
      id={groupId}
      orientation="vertical"
      className="h-full min-h-0"
      defaultLayout={createPlacementSplitLayout(state, placements, defaultSideSplitSize)}
      onLayoutChanged={(layout) => resizePlacementSplit(dock, placements, layout)}
    >
      {placements.map((placement, index) => (
        <React.Fragment key={placement}>
          {index > 0 ? (
            <DockResizeHandle id={`${groupId}-${placement}-resize`} orientation="horizontal" />
          ) : null}
          <Panel id={placement} className="min-h-0" minSize="8rem">
            <DockPlacement
              dragAndDrop={dragAndDrop}
              placement={placement}
              renderToolWindowHeader={renderToolWindowHeader}
              renderToolWindow={renderToolWindow}
            />
          </Panel>
        </React.Fragment>
      ))}
    </PanelGroup>
  );
}

/**
 * Horizontal stack for bottom-left and bottom-right dock placements.
 *
 * @param props - Placement stack options, including render callbacks shared
 * with the main layout.
 *
 * @example
 * ```tsx
 * <DockBottomPlacements
 *   groupId="bottom"
 *   placements={["bottom-left", "bottom-right"]}
 *   dragAndDrop
 * />
 * ```
 */
export function DockBottomPlacements({
  dragAndDrop,
  groupId,
  placements,
  renderToolWindow,
  renderToolWindowHeader,
}: DockPlacementStackProps) {
  const dock = useDock();
  const state = useDockState((dockState) => dockState);

  if (placements.length === 1) {
    const placement = placements[0];

    if (!placement) {
      return null;
    }

    return (
      <DockPlacement
        dragAndDrop={dragAndDrop}
        placement={placement}
        renderToolWindowHeader={renderToolWindowHeader}
        renderToolWindow={renderToolWindow}
      />
    );
  }

  return (
    <PanelGroup
      id={groupId}
      orientation="horizontal"
      className="h-full min-h-0"
      defaultLayout={createPlacementSplitLayout(state, placements, defaultBottomSplitSize)}
      onLayoutChanged={(layout) => resizePlacementSplit(dock, placements, layout)}
    >
      {placements.map((placement, index) => (
        <React.Fragment key={placement}>
          {index > 0 ? <DockResizeHandle id={`${groupId}-${placement}-resize`} /> : null}
          <Panel id={placement} className="min-h-0" minSize="12rem">
            <DockPlacement
              dragAndDrop={dragAndDrop}
              placement={placement}
              renderToolWindowHeader={renderToolWindowHeader}
              renderToolWindow={renderToolWindow}
            />
          </Panel>
        </React.Fragment>
      ))}
    </PanelGroup>
  );
}

/**
 * One docked placement surface that accepts dropped tool-window buttons.
 *
 * @param props - Placement id, drag behavior, and tool-window render callbacks.
 * @returns The active panel content for a placement, or an empty drop target.
 */
function DockPlacement({
  dragAndDrop,
  placement,
  renderToolWindow,
  renderToolWindowHeader,
}: DockPlacementProps) {
  const state = useDockState((dockState) => dockState);
  const toolWindows = getPlacementToolWindows(state, placement);
  const activeToolWindow = getActiveToolWindow(state, placement);
  const droppable = useDroppable({
    id: `placement:${placement}`,
    data: { placement, index: toolWindows.length } satisfies DockDropData,
    disabled: !dragAndDrop,
  });

  return (
    <section
      ref={droppable.setNodeRef}
      className={cn(
        "relative flex h-full min-h-0 flex-col border bg-background transition-colors",
        droppable.isOver && "border-ring bg-muted/40 ring-2 ring-ring/40",
      )}
    >
      {droppable.isOver ? (
        <div className="pointer-events-none absolute inset-2 z-10 rounded-md border border-dashed border-ring bg-background/70" />
      ) : null}
      {activeToolWindow ? (
        <>
          <DockToolHeader
            renderToolWindowHeader={renderToolWindowHeader}
            toolWindow={activeToolWindow}
          />
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {renderToolWindow?.(activeToolWindow) ?? activeToolWindow.title}
          </div>
        </>
      ) : null}
    </section>
  );
}
