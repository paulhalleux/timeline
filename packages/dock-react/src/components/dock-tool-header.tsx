import { Button } from "@ptl/ui";
import type { ToolWindowState } from "@ptl/dock-core";
import type * as React from "react";

import { useDock } from "../provider/dock-provider";

export interface DockToolHeaderProps {
  /** Optional custom header renderer for the active tool window. */
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
  /** Active tool window represented by the panel. */
  toolWindow: ToolWindowState;
}

/**
 * Panel header chrome with built-in dock actions.
 *
 * Tool-window toolbar buttons own drag and context-menu behavior, so headers
 * stay stable for custom renderers such as terminal tabs while still exposing
 * hide and float actions for contributed tools.
 *
 * @example
 * ```tsx
 * <DockToolHeader toolWindow={toolWindow} />
 * ```
 */
export function DockToolHeader({ renderToolWindowHeader, toolWindow }: DockToolHeaderProps) {
  const dock = useDock();
  const headerContent = renderToolWindowHeader?.(toolWindow) ?? toolWindow.title;

  return (
    <div className="flex min-h-9 items-center gap-1 border-b px-2 text-sm font-medium select-none">
      <div className="min-w-0 flex-1 truncate">{headerContent}</div>
      <Button size="sm" variant="ghost" onClick={() => dock.floatToolWindow(toolWindow.id)}>
        Float
      </Button>
      <Button size="sm" variant="ghost" onClick={() => dock.hideToolWindow(toolWindow.id)}>
        Hide
      </Button>
    </div>
  );
}
