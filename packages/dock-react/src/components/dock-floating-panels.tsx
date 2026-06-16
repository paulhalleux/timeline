import { Button, cn } from "@ptl/ui";
import type { FloatingItemState, ToolWindowState } from "@ptl/dock-core";
import * as React from "react";

import { useDock, useDockState } from "../provider/dock-provider";

export interface DockFloatingPanelsProps {
  /** Render the active content for a floating tool window. */
  renderToolWindow?: (toolWindow: ToolWindowState) => React.ReactNode;
  /** Render custom header content for a floating tool window. */
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
}

/**
 * Floating dock layer for undocked tool windows.
 *
 * @param props - Render callbacks shared with the docked dock layout.
 *
 * @example
 * ```tsx
 * <DockFloatingPanels renderToolWindow={(tool) => <Tool id={tool.id} />} />
 * ```
 */
export function DockFloatingPanels({
  renderToolWindow,
  renderToolWindowHeader,
}: DockFloatingPanelsProps) {
  const state = useDockState((dockState) => dockState);
  const floatingToolWindows = state.floating
    .filter((item) => item.kind === "tool-window")
    .map((item) => ({ item, toolWindow: state.toolWindows[item.id] }))
    .filter((entry): entry is { item: FloatingItemState; toolWindow: ToolWindowState } =>
      Boolean(entry.toolWindow && !entry.toolWindow.hidden),
    );

  if (floatingToolWindows.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {floatingToolWindows.map(({ item, toolWindow }) => (
        <DockFloatingPanel
          key={item.id}
          item={item}
          renderToolWindow={renderToolWindow}
          renderToolWindowHeader={renderToolWindowHeader}
          toolWindow={toolWindow}
        />
      ))}
    </div>
  );
}

interface DockFloatingPanelProps {
  item: FloatingItemState;
  renderToolWindow?: (toolWindow: ToolWindowState) => React.ReactNode;
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
  toolWindow: ToolWindowState;
}

/**
 * One movable floating tool-window panel.
 *
 * @param props - Floating item bounds, tool-window state, and render callbacks.
 */
function DockFloatingPanel({
  item,
  renderToolWindow,
  renderToolWindowHeader,
  toolWindow,
}: DockFloatingPanelProps) {
  const dock = useDock();
  const dragRef = React.useRef<{ startX: number; startY: number; x: number; y: number } | null>(
    null,
  );
  const headerContent = renderToolWindowHeader?.(toolWindow) ?? toolWindow.title;

  /**
   * Capture the pointer origin before moving the floating panel.
   *
   * @param event - Pointer event from the floating panel header.
   */
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, x: item.x, y: item.y };
  }

  /**
   * Move the panel while the header pointer is captured.
   *
   * @param event - Pointer move event emitted during header drag.
   */
  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    dock.moveFloatingItem(
      item.id,
      Math.max(0, drag.x + event.clientX - drag.startX),
      Math.max(0, drag.y + event.clientY - drag.startY),
    );
  }

  /**
   * Release the active floating drag gesture.
   */
  function handlePointerUp() {
    dragRef.current = null;
  }

  return (
    <section
      className={cn(
        "pointer-events-auto absolute flex min-h-20 min-w-32 flex-col border bg-background shadow-md",
      )}
      style={{
        height: item.height,
        left: item.x,
        top: item.y,
        width: item.width,
      }}
    >
      <div
        className="flex min-h-9 cursor-grab items-center gap-1 border-b px-2 text-sm font-medium select-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="min-w-0 flex-1 truncate">{headerContent}</div>
        <Button size="sm" variant="ghost" onClick={() => dock.dockToolWindow(toolWindow.id)}>
          Dock
        </Button>
        <Button size="sm" variant="ghost" onClick={() => dock.hideToolWindow(toolWindow.id)}>
          Hide
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {renderToolWindow?.(toolWindow) ?? toolWindow.title}
      </div>
    </section>
  );
}
