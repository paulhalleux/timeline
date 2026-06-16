import { Button } from "@ptl/ui";
import type { WorkspaceItemState } from "@ptl/dock-core";
import type * as React from "react";

import { useDock, useDockState } from "../provider/dock-provider";
import { getActiveWorkspaceItem, getWorkspaceItems } from "../utils/layout-selectors";

export interface DockWorkspaceProps {
  /** Render the active central workspace item. */
  renderWorkspaceItem?: (item: WorkspaceItemState) => React.ReactNode;
  /** Render the central workspace empty state when no item is active. */
  renderEmptyWorkspace?: () => React.ReactNode;
}

/**
 * Central tabbed workspace area between docked dock tools.
 *
 * @example
 * ```tsx
 * <DockWorkspace renderWorkspaceItem={(item) => <Editor item={item} />} />
 * ```
 */
export function DockWorkspace({
  renderWorkspaceItem,
  renderEmptyWorkspace,
}: DockWorkspaceProps) {
  const dock = useDock();
  const state = useDockState((dockState) => dockState);
  const items = getWorkspaceItems(state);
  const activeItem = getActiveWorkspaceItem(state);

  return (
    <main className="flex h-full min-h-0 flex-col border bg-background">
      <div className="flex min-h-9 items-center gap-1 border-b px-1">
        {items.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={item.id === activeItem?.id ? "secondary" : "ghost"}
            onClick={() => dock.activateWorkspaceItem(item.id)}
          >
            {item.title}
          </Button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {activeItem
          ? (renderWorkspaceItem?.(activeItem) ?? activeItem.title)
          : (renderEmptyWorkspace?.() ?? null)}
      </div>
    </main>
  );
}
