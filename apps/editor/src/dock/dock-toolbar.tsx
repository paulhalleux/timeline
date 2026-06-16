import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  cn,
} from "@ptl/ui";
import type { DockedPlacement, DockState } from "@ptl/dock-core";
import { useDock, useDockState } from "@ptl/dock-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Ellipsis, type LucideIcon } from "lucide-react";

import { ToolbarItemButton } from "./dock-toolbar-item";

/**
 * Toolbar metadata for one dock tool-window button.
 *
 * @example
 * ```ts
 * const outline: EditorDockToolbarItem = {
 *   id: "outline",
 *   label: "Outline",
 *   placement: "left-top",
 *   icon: ListTree,
 * };
 * ```
 */
export interface EditorDockToolbarItem {
  id: string;
  label: string;
  placement: DockedPlacement;
  icon: LucideIcon;
}

export interface EditorDockToolbarProps {
  /** All toolbar-capable dock tool windows, regardless of current side. */
  items: readonly EditorDockToolbarItem[];
  /** Side rail that should render items currently placed on this side. */
  side: "left" | "right";
}

/**
 * JetBrains-like side toolbar for visible and hidden dock tool windows.
 *
 * Items follow their current dock placement. When every side item is in a
 * side-bottom slot, those buttons are promoted above the separator because that
 * placement is visually equivalent to the top group without a sibling stack.
 *
 * @example
 * ```tsx
 * <EditorDockToolbar side="left" items={toolbarItems} />
 * ```
 */
export function EditorDockToolbar({
  items,
  side,
}: EditorDockToolbarProps) {
  const state = useDockState((dockState) => dockState);
  const hiddenItems = items.filter((item) => state.toolWindows[item.id]?.hidden);
  const resolvedItems = items.map((item) => ({
    ...item,
    currentPlacement: getToolWindowPlacement(state, item.id) ?? item.placement,
  })).filter((item) => !state.toolWindows[item.id]?.hidden && !isToolWindowFloating(state, item.id));
  const sortByPlacement = (
    group: typeof resolvedItems,
    placement: DockedPlacement,
  ) => {
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
      <SortableContext items={topItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {topItems.map((item) => (
          <ToolbarItemButton key={item.id} item={item} side={side} />
        ))}
      </SortableContext>
      {sideBottomItems.length > 0 ? <Separator className="my-1 w-5" /> : null}
      <SortableContext items={sideBottomItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {sideBottomItems.map((item) => (
          <ToolbarItemButton key={item.id} item={item} side={side} />
        ))}
      </SortableContext>
      {railBottomItems.length > 0 ? <div className="min-h-2 flex-1" /> : null}
      {side === "left" && railBottomItems.length === 0 && hiddenItems.length > 0 ? (
        <div className="min-h-2 flex-1" />
      ) : null}
      <SortableContext items={railBottomItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {railBottomItems.map((item) => (
          <ToolbarItemButton key={item.id} item={item} side={side} />
        ))}
      </SortableContext>
      {side === "left" && hiddenItems.length > 0 ? (
        <HiddenToolWindowMenu items={hiddenItems} />
      ) : null}
    </div>
  );
}

interface HiddenToolWindowMenuProps {
  items: readonly EditorDockToolbarItem[];
}

/**
 * Overflow menu for restoring completely hidden tool windows.
 *
 * @param props - Hidden toolbar items that can be shown again.
 *
 * @example
 * ```tsx
 * <HiddenToolWindowMenu items={hiddenToolbarItems} />
 * ```
 */
function HiddenToolWindowMenu({ items }: HiddenToolWindowMenuProps) {
  const dock = useDock();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Hidden tool windows" className="size-7" size="icon-sm" variant="ghost">
            <Ellipsis aria-hidden className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" side="right">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Hidden panels</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <DropdownMenuItem key={item.id} onClick={() => dock.showToolWindow(item.id)}>
                <Icon aria-hidden className="size-4" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Resolve a tool window's current dock placement from serialized dock state.
 *
 * @param state - Current dock state snapshot.
 * @param toolWindowId - Tool-window id to locate.
 * @returns The placement containing the tool window, or `undefined` when hidden.
 */
function getToolWindowPlacement(
  state: DockState,
  toolWindowId: string,
) {
  const placement = Object.entries(state.placements).find(([, placementState]) =>
    placementState.itemIds.includes(toolWindowId),
  );

  return placement?.[0] as DockedPlacement | undefined;
}

/**
 * Check whether a tool window is currently rendered as an undocked panel.
 *
 * @param state - Current dock state snapshot.
 * @param toolWindowId - Tool-window id to locate.
 * @returns `true` when the tool window exists in the floating layer.
 */
function isToolWindowFloating(state: DockState, toolWindowId: string): boolean {
  return state.floating.some((item) => item.kind === "tool-window" && item.id === toolWindowId);
}
