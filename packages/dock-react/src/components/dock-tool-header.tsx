import type { ToolWindowState } from "@ptl/dock-core";
import type * as React from "react";

export interface DockToolHeaderProps {
  /** Optional custom header renderer for the active tool window. */
  renderToolWindowHeader?: (toolWindow: ToolWindowState) => React.ReactNode;
  /** Active tool window represented by the panel. */
  toolWindow: ToolWindowState;
}

/**
 * Passive panel header chrome.
 *
 * Tool-window toolbar buttons own drag and context-menu behavior, so headers
 * stay stable for custom renderers such as terminal tabs.
 *
 * @example
 * ```tsx
 * <DockToolHeader toolWindow={toolWindow} />
 * ```
 */
export function DockToolHeader({
  renderToolWindowHeader,
  toolWindow,
}: DockToolHeaderProps) {
  const headerContent = renderToolWindowHeader?.(toolWindow) ?? toolWindow.title;

  return (
    <div className="flex min-h-9 items-center border-b px-2 text-sm font-medium select-none">
      <div className="min-w-0 flex-1 truncate">{headerContent}</div>
    </div>
  );
}
