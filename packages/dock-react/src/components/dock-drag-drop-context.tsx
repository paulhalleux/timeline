import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { DockedPlacement, ToolWindowState } from "@ptl/dock-core";
import * as React from "react";

import { useDock, useDockState } from "../provider/dock-provider";
import type { DockDropData } from "./dock-dnd";

export interface DockDragDropContextProps {
  children: React.ReactNode;
  renderDragPreview?: (toolWindow: ToolWindowState) => React.ReactNode;
}

/**
 * Shares dock drag/drop state between toolbar buttons and placement drop zones.
 *
 * @example
 * ```tsx
 * <DockDragDropContext renderDragPreview={(tool) => tool.title}>
 *   <DockToolbar />
 *   <DockResolvedLayout />
 * </DockDragDropContext>
 * ```
 */
export function DockDragDropContext({
  children,
  renderDragPreview,
}: DockDragDropContextProps) {
  const dock = useDock();
  const toolWindows = useDockState((state) => state.toolWindows);
  const [activeToolWindowId, setActiveToolWindowId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Remember the active tool window so the overlay can render a preview.
   *
   * @param event - Drag start event emitted by dnd-kit.
   */
  function handleDragStart(event: DragStartEvent) {
    setActiveToolWindowId(String(event.active.id));
  }

  /**
   * Dock the dragged tool window into the placement under the pointer,
   * or reorder it within its current placement when dropped on another toolbar item.
   *
   * @param event - Drag end event with the active item and droppable target.
   */
  function handleDragEnd(event: DragEndEvent) {
    const toolWindowId = String(event.active.id);
    const overData = event.over?.data.current;

    setActiveToolWindowId(null);

    if (!overData) {
      return;
    }

    // Sortable drop: reorder within the same placement toolbar section.
    if (overData.sortable) {
      const targetId = String(event.over!.id);
      const targetToolWindow = toolWindows[targetId];

      if (targetId !== toolWindowId && targetToolWindow) {
        dock.moveToolWindow(toolWindowId, targetToolWindow.placement as DockedPlacement, overData.sortable.index);
      }

      return;
    }

    // Placement drop zone: move to a different dock placement.
    const drop = overData as DockDropData | undefined;

    if (drop) {
      dock.moveToolWindow(toolWindowId, drop.placement, drop.index);
    }
  }

  const activeToolWindow = activeToolWindowId ? toolWindows[activeToolWindowId] : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveToolWindowId(null)}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeToolWindow ? (
          <div className="w-fit rounded-md border bg-popover px-2 py-1 text-sm font-medium text-popover-foreground shadow-md">
            {renderDragPreview?.(activeToolWindow) ?? activeToolWindow.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
