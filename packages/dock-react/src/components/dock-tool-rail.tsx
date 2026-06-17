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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@ptl/ui";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DockedPlacement, DockState, ToolDefinition } from "@ptl/dock-core";
import * as React from "react";

import { useDock, useDockState } from "../provider/dock-provider";

export interface DockToolRailProps {
  readonly side: "left" | "right";
  readonly tools: readonly ToolDefinition<unknown, unknown, unknown>[];
}

/**
 * Side rail for contributed dock tools.
 *
 * Buttons activate/deactivate panels, can be dragged between dock placements,
 * and expose the same move/float/hide actions through a context menu that the
 * editor shell previously owned directly.
 */
export function DockToolRail({ side, tools }: DockToolRailProps) {
  const state = useDockState((dockState) => dockState);
  const items = tools.map((tool) => ({
    id: tool.id,
    label: getLocalizedText(tool.title),
    icon: tool.icon,
    placement: tool.preferredPlacement ?? (side === "left" ? "left-top" : "right-top"),
  }));
  const hiddenItems = items.filter((item) => state.toolWindows[item.id]?.hidden);
  const resolvedItems = items
    .map((item) => ({
      ...item,
      currentPlacement: getToolWindowPlacement(state, item.id) ?? item.placement,
    }))
    .filter((item) => !state.toolWindows[item.id]?.hidden && !isToolWindowFloating(state, item.id));
  const sortByPlacement = (group: typeof resolvedItems, placement: DockedPlacement) => {
    const ids = state.placements[placement]?.itemIds ?? [];
    return [...group].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  };
  const nativeTopItems = sortByPlacement(
    resolvedItems.filter((item) => item.currentPlacement === `${side}-top`),
    `${side}-top` as DockedPlacement,
  );
  const nativeSideBottomItems = sortByPlacement(
    resolvedItems.filter((item) => item.currentPlacement === `${side}-bottom`),
    `${side}-bottom` as DockedPlacement,
  );
  const topItems = nativeTopItems.length > 0 ? nativeTopItems : nativeSideBottomItems;
  const sideBottomItems = nativeTopItems.length > 0 ? nativeSideBottomItems : [];
  const railBottomItems = sortByPlacement(
    resolvedItems.filter((item) => item.currentPlacement === `bottom-${side}`),
    `bottom-${side}` as DockedPlacement,
  );

  return (
    <div
      className={cn(
        "flex w-9 shrink-0 flex-col items-center gap-1 border-border bg-muted/20 py-1",
        side === "left" ? "border-r" : "border-l",
      )}
    >
      <SortableContext
        items={topItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {topItems.map((item) => (
          <DockToolRailButton key={item.id} item={item} side={side} />
        ))}
      </SortableContext>
      {sideBottomItems.length > 0 ? <Separator className="my-1 w-5" /> : null}
      <SortableContext
        items={sideBottomItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {sideBottomItems.map((item) => (
          <DockToolRailButton key={item.id} item={item} side={side} />
        ))}
      </SortableContext>
      {railBottomItems.length > 0 || (side === "left" && hiddenItems.length > 0) ? (
        <div className="min-h-2 flex-1" />
      ) : null}
      <SortableContext
        items={railBottomItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {railBottomItems.map((item) => (
          <DockToolRailButton key={item.id} item={item} side={side} />
        ))}
      </SortableContext>
      {side === "left" && hiddenItems.length > 0 ? <HiddenToolMenu items={hiddenItems} /> : null}
    </div>
  );
}

interface DockToolRailButtonProps {
  readonly item: {
    readonly id: string;
    readonly label: string;
    readonly icon?: unknown;
    readonly placement: DockedPlacement;
  };
  readonly side: "left" | "right";
}

function DockToolRailButton({ item, side }: DockToolRailButtonProps) {
  const Icon = item.icon as
    | React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
    | undefined;
  const dock = useDock();
  const state = useDockState((dockState) => dockState);
  const currentPlacement = getToolWindowPlacement(state, item.id);
  const active = currentPlacement
    ? state.placements[currentPlacement].activeItemId === item.id
    : false;
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
                    if (active) dock.deactivateToolWindow(item.id);
                    else if (currentPlacement) dock.activateToolWindow(item.id);
                    else dock.showToolWindow(item.id);
                  }}
                >
                  {Icon ? (
                    <Icon aria-hidden className="size-4" />
                  ) : (
                    <span aria-hidden className="text-[10px] font-semibold uppercase">
                      {item.label.slice(0, 2)}
                    </span>
                  )}
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
                  if (!currentPlacement) dock.showToolWindow(item.id);
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

function HiddenToolMenu({ items }: { readonly items: readonly DockToolRailButtonProps["item"][] }) {
  const dock = useDock();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Hidden tool windows"
            className="size-7"
            size="icon-sm"
            variant="ghost"
          >
            …
          </Button>
        }
      />
      <DropdownMenuContent align="start" side="right">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Hidden panels</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => (
            <DropdownMenuItem key={item.id} onClick={() => dock.showToolWindow(item.id)}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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

function getToolWindowPlacement(state: DockState, toolWindowId: string) {
  const placement = Object.entries(state.placements).find(([, placementState]) =>
    placementState.itemIds.includes(toolWindowId),
  );
  return placement?.[0] as DockedPlacement | undefined;
}

function isToolWindowFloating(state: DockState, toolWindowId: string): boolean {
  return state.floating.some((item) => item.kind === "tool-window" && item.id === toolWindowId);
}

function getLocalizedText(text: unknown): string {
  if (typeof text === "string") return text;
  if (text && typeof text === "object" && "defaultMessage" in text) {
    return String((text as { readonly defaultMessage: unknown }).defaultMessage);
  }
  return String(text ?? "");
}
