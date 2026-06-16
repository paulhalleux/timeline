import { cn } from "@ptl/ui";
import type { ToolWindowState, WorkspaceItemState } from "@ptl/dock-core";
import type * as React from "react";
import { Group as PanelGroup, Panel } from "react-resizable-panels";

import { useDock, useDockState } from "../provider/dock-provider";
import {
  bottomPlacements,
  bottomRegionPanelId,
  createMainLayout,
  createRootLayout,
  getVisiblePlacements,
  leftPlacements,
  leftRegionPanelId,
  mainPanelId,
  rightPlacements,
  rightRegionPanelId,
  workspacePanelId,
} from "./dock-layout-model";
import { DockBottomPlacements, DockPlacementStack } from "./dock-placement";
import { DockFloatingPanels } from "./dock-floating-panels";
import { DockResizeHandle } from "./dock-resize-handle";
import { DockWorkspace } from "./dock-workspace";

export interface DockLayoutProps {
  /** Additional class names applied to the root panel group. */
  className?: string;
  /** Enables dropping toolbar items into dock placements. */
  dragAndDrop?: boolean;
  /** Render the active content for a docked tool window. */
  renderToolWindow?: (toolWindow: ToolWindowState) => React.ReactNode;
  /** Render custom passive chrome for the active tool-window header. */
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
  /** Render the active central workspace item. */
  renderWorkspaceItem?: (item: WorkspaceItemState) => React.ReactNode;
  /** Render the central workspace empty state. */
  renderEmptyWorkspace?: () => React.ReactNode;
}

/**
 * Generic JetBrains-style dock layout for docked tools and center content.
 *
 * Region sizes persist the left, right, and bottom shell panels. Placement sizes
 * persist splits inside those regions, such as `left-top`/`left-bottom`.
 *
 * @example
 * ```tsx
 * <DockLayout
 *   renderWorkspaceItem={(item) => <Editor id={item.id} />}
 *   renderToolWindow={(toolWindow) => <Tool id={toolWindow.id} />}
 * />
 * ```
 */
export function DockLayout({
  className,
  dragAndDrop = true,
  renderToolWindow,
  renderToolWindowHeader,
  renderWorkspaceItem,
  renderEmptyWorkspace,
}: DockLayoutProps) {
  const dock = useDock();
  const state = useDockState((dockState) => dockState);
  const visibleLeftPlacements = getVisiblePlacements(state, leftPlacements);
  const visibleRightPlacements = getVisiblePlacements(state, rightPlacements);
  const visibleBottomPlacements = getVisiblePlacements(state, bottomPlacements);
  const hasLeftTools = visibleLeftPlacements.length > 0;
  const hasRightTools = visibleRightPlacements.length > 0;
  const hasBottomTools = visibleBottomPlacements.length > 0;

  return (
    <div className={cn("relative h-full min-h-0", className)}>
      <PanelGroup
        id="dock-root"
        orientation="vertical"
        className="h-full min-h-0"
        defaultLayout={createRootLayout(state, hasBottomTools)}
        onLayoutChanged={(layout) => {
          const bottomSize = layout[bottomRegionPanelId];

          if (bottomSize !== undefined) {
            dock.resizeRegion("bottom", bottomSize);
          }
        }}
      >
        <Panel id={mainPanelId} className="min-h-0" minSize="20rem">
          <PanelGroup
            id="dock-main-horizontal"
            orientation="horizontal"
            className="h-full min-h-0"
            defaultLayout={createMainLayout(state, hasLeftTools, hasRightTools)}
            onLayoutChanged={(layout) => {
              const leftSize = layout[leftRegionPanelId];
              const rightSize = layout[rightRegionPanelId];

              if (leftSize !== undefined) {
                dock.resizeRegion("left", leftSize);
              }

              if (rightSize !== undefined) {
                dock.resizeRegion("right", rightSize);
              }
            }}
          >
            {hasLeftTools ? (
              <>
                <Panel id={leftRegionPanelId} className="min-h-0" minSize="12rem">
                  <DockPlacementStack
                    dragAndDrop={dragAndDrop}
                    groupId="dock-left-stack"
                    placements={visibleLeftPlacements}
                    renderToolWindowHeader={renderToolWindowHeader}
                    renderToolWindow={renderToolWindow}
                  />
                </Panel>
                <DockResizeHandle id="dock-left-resize" />
              </>
            ) : null}
            <Panel id={workspacePanelId} className="min-h-0" minSize="20rem">
              <DockWorkspace
                renderWorkspaceItem={renderWorkspaceItem}
                renderEmptyWorkspace={renderEmptyWorkspace}
              />
            </Panel>
            {hasRightTools ? (
              <>
                <DockResizeHandle id="dock-right-resize" />
                <Panel id={rightRegionPanelId} className="min-h-0" minSize="12rem">
                  <DockPlacementStack
                    dragAndDrop={dragAndDrop}
                    groupId="dock-right-stack"
                    placements={visibleRightPlacements}
                    renderToolWindowHeader={renderToolWindowHeader}
                    renderToolWindow={renderToolWindow}
                  />
                </Panel>
              </>
            ) : null}
          </PanelGroup>
        </Panel>
        {hasBottomTools ? (
          <>
            <DockResizeHandle id="dock-bottom-resize" orientation="horizontal" />
            <Panel id={bottomRegionPanelId} className="min-h-0" minSize="7rem">
              <DockBottomPlacements
                dragAndDrop={dragAndDrop}
                groupId="dock-bottom-stack"
                placements={visibleBottomPlacements}
                renderToolWindowHeader={renderToolWindowHeader}
                renderToolWindow={renderToolWindow}
              />
            </Panel>
          </>
        ) : null}
      </PanelGroup>
      <DockFloatingPanels
        renderToolWindow={renderToolWindow}
        renderToolWindowHeader={renderToolWindowHeader}
      />
    </div>
  );
}
