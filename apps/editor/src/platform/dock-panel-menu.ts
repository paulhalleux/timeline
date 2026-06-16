import {
  PlatformRuntime,
  defineCommand,
  type MenuContribution,
} from "@ptl/platform-core";
import type { DockStateStore } from "@ptl/dock-core";

export interface DockPanelToggleRegistration {
  platform: PlatformRuntime;
  menus: MenuContribution[];
  dock: DockStateStore;
  id: string;
  title: string;
  toolWindowId: string;
  order: number;
}

/**
 * Register a checked View > Panels item that toggles a dock tool window.
 *
 * The checked function reads the store at render time so menu state updates
 * after toolbar clicks, context-menu moves, or shortcut-triggered changes.
 *
 * @example
 * ```ts
 * registerDockPanelToggle({
 *   platform,
 *   menus,
 *   dock,
 *   id: "editor.view.toggleOutline",
 *   title: "Outline",
 *   toolWindowId: "outline",
 *   order: 10,
 * });
 * ```
 */
export function registerDockPanelToggle({
  platform,
  menus,
  dock,
  id,
  title,
  toolWindowId,
  order,
}: DockPanelToggleRegistration) {
  const command = defineCommand<void, void>({
    id,
    title,
    category: "View",
  });

  platform.commands.register(command);
  platform.commands.registerHandler(command, () => {
    dock.toggleToolWindow(toolWindowId);
  });
  menus.push({
    kind: "toggle",
    menu: "main.view.panels",
    command,
    checked: () => isToolWindowVisible(dock, toolWindowId),
    group: "Panels",
    order,
  });
}

/**
 * Check whether a dock tool window is present in any dock placement.
 *
 * @param dock - Store that owns the current editor dock state.
 * @param toolWindowId - Tool-window id to search for.
 * @returns `true` when the tool window is currently visible in a placement.
 */
export function isToolWindowVisible(dock: DockStateStore, toolWindowId: string): boolean {
  const state = dock.getState();
  const toolWindow = state.toolWindows[toolWindowId];

  if (toolWindow?.hidden) {
    return false;
  }

  return (
    Object.values(state.placements).some((placement) => placement.itemIds.includes(toolWindowId)) ||
    state.floating.some((item) => item.kind === "tool-window" && item.id === toolWindowId)
  );
}
