import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@ptl/ui";
import type { DockedPlacement, DockState } from "@ptl/dock-core";
import { useDock, useDockState } from "@ptl/dock-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { EditorDockToolbarItem } from "./dock-toolbar";

export interface ToolbarItemButtonProps {
  /** Toolbar item metadata and icon. */
  item: EditorDockToolbarItem;
  /** Side rail used to position tooltip and context menu popovers. */
  side: "left" | "right";
}

/**
 * Draggable toolbar button with a context menu for moving and hiding panels.
 *
 * @param props - Toolbar item metadata and rail side.
 *
 * @example
 * ```tsx
 * <ToolbarItemButton item={outlineItem} side="left" />
 * ```
 */
export function ToolbarItemButton({ item, side }: ToolbarItemButtonProps) {
  const dock = useDock();
  const state = useDockState((dockState) => dockState);
  const currentPlacement = getToolWindowPlacement(state, item.id);
  const active = currentPlacement
    ? state.placements[currentPlacement].activeItemId === item.id
    : false;
  const Icon = item.icon;
  const drag = useSortable({
    id: item.id,
    data: {
      placement: currentPlacement ?? item.placement,
      index: currentPlacement ? state.placements[currentPlacement].itemIds.indexOf(item.id) : 0,
    },
  });

  return (
    <ContextMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <ContextMenuTrigger
              render={
                <Button
                  ref={drag.setNodeRef}
                  {...drag.attributes}
                  {...drag.listeners}
                  aria-pressed={active}
                  className={cn(
                    "size-7 cursor-grab active:cursor-grabbing",
                    drag.isDragging && "opacity-0",
                  )}
                  size="icon-sm"
                  style={{
                    transform: drag.isDragging ? undefined : CSS.Transform.toString(drag.transform),
                    transition: drag.isDragging ? undefined : drag.transition,
                  }}
                  variant={active ? "secondary" : "ghost"}
                  onClick={() => {
                    if (active) {
                      dock.deactivateToolWindow(item.id);
                    } else if (currentPlacement) {
                      dock.activateToolWindow(item.id);
                    } else {
                      dock.showToolWindow(item.id);
                    }
                  }}
                >
                  <Icon aria-hidden className="size-4" />
                  <span className="sr-only">{item.label}</span>
                </Button>
              }
            />
          }
        />
        <TooltipContent side={side === "left" ? "right" : "left"}>{item.label}</TooltipContent>
      </Tooltip>
      <ContextMenuContent side={side === "left" ? "right" : "left"} align="start">
        <ContextMenuLabel>{item.label}</ContextMenuLabel>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {Object.entries(placementLabels).map(([placement, label]) => (
              <ContextMenuItem
                key={placement}
                disabled={placement === currentPlacement}
                onClick={() => {
                  if (!currentPlacement) {
                    dock.showToolWindow(item.id);
                  }

                  dock.moveToolWindow(item.id, placement as DockedPlacement);
                }}
              >
                {label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        {currentPlacement ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => dock.floatToolWindow(item.id)}>Float</ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={() => dock.hideToolWindow(item.id)}>
              Hide
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

const placementLabels: Record<DockedPlacement, string> = {
  "left-top": "Left top",
  "left-bottom": "Left bottom",
  "right-top": "Right top",
  "right-bottom": "Right bottom",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

/**
 * Resolve a tool window's current dock placement from serialized dock state.
 *
 * @param state - Current dock state snapshot.
 * @param toolWindowId - Tool-window id to locate.
 * @returns The placement containing the tool window, or `undefined` when hidden.
 */
function getToolWindowPlacement(state: DockState, toolWindowId: string) {
  const placement = Object.entries(state.placements).find(([, placementState]) =>
    placementState.itemIds.includes(toolWindowId),
  );

  return placement?.[0] as DockedPlacement | undefined;
}
