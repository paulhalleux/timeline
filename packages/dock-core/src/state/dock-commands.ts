import {
  createCommand,
  type CommandDefinition,
  type Disposable,
} from "@ptl/platform-core";

import type {
  DockedPlacement,
  DockRegion,
  WorkspaceItemState,
} from "../layout-state";
import type { DockStateStore } from "./dock-store";

/**
 * Stable command ids exposed by the store-backed dock API.
 *
 * These are integration identifiers for `platform-core`; normal application
 * code should call `DockStateStore` methods directly.
 *
 * @example
 * ```ts
 * platform.commands.execute(dockCommandIds.toolWindowToggle, "outline");
 * ```
 */
interface CommandRegistrar {
  registerHandler<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    handler: (input: TInput) => TResult | Promise<TResult>,
  ): Disposable;
}

export const dockCommandIds = {
  toolWindowShow: "dock.toolWindow.show",
  toolWindowActivate: "dock.toolWindow.activate",
  toolWindowDeactivate: "dock.toolWindow.deactivate",
  toolWindowHide: "dock.toolWindow.hide",
  toolWindowToggle: "dock.toolWindow.toggle",
  toolWindowMove: "dock.toolWindow.move",
  toolWindowFloat: "dock.toolWindow.float",
  toolWindowDock: "dock.toolWindow.dock",
  toolWindowResize: "dock.toolWindow.resize",
  regionResize: "dock.region.resize",
  workspaceOpen: "dock.workspace.open",
  workspaceClose: "dock.workspace.close",
  workspaceActivate: "dock.workspace.activate",
} as const;

/**
 * Command definitions bound by `registerDockCommands`.
 *
 * Each command input mirrors the corresponding store method. For example,
 * `toolWindowMove` receives `{ toolWindowId, placement, index }` and calls
 * `dock.moveToolWindow(...)`.
 *
 * @example
 * ```ts
 * platform.commands.register(dockCommands.toolWindowToggle);
 * platform.commands.registerHandler(dockCommands.toolWindowToggle, (id) => {
 *   dock.toggleToolWindow(id);
 * });
 * ```
 */
export const dockCommands = {
  toolWindowShow: createCommand<string>({
    id: dockCommandIds.toolWindowShow,
    title: "Show tool window",
  }),
  toolWindowActivate: createCommand<string>({
    id: dockCommandIds.toolWindowActivate,
    title: "Activate tool window",
  }),
  toolWindowDeactivate: createCommand<string>({
    id: dockCommandIds.toolWindowDeactivate,
    title: "Deactivate tool window",
  }),
  toolWindowHide: createCommand<string>({
    id: dockCommandIds.toolWindowHide,
    title: "Hide tool window",
  }),
  toolWindowToggle: createCommand<string>({
    id: dockCommandIds.toolWindowToggle,
    title: "Toggle tool window",
  }),
  toolWindowMove: createCommand<{
    toolWindowId: string;
    placement: DockedPlacement;
    index?: number;
  }>({
    id: dockCommandIds.toolWindowMove,
    title: "Move tool window",
  }),
  toolWindowFloat: createCommand<{ toolWindowId: string }>({
    id: dockCommandIds.toolWindowFloat,
    title: "Float tool window",
  }),
  toolWindowDock: createCommand<{
    toolWindowId: string;
    placement?: DockedPlacement;
    index?: number;
  }>({
    id: dockCommandIds.toolWindowDock,
    title: "Dock tool window",
  }),
  toolWindowResize: createCommand<{ placement: DockedPlacement; size: number }>({
    id: dockCommandIds.toolWindowResize,
    title: "Resize tool window placement",
  }),
  regionResize: createCommand<{ region: DockRegion; size: number }>({
    id: dockCommandIds.regionResize,
    title: "Resize dock region",
  }),
  workspaceOpen: createCommand<WorkspaceItemState>({
    id: dockCommandIds.workspaceOpen,
    title: "Open workspace item",
  }),
  workspaceClose: createCommand<string>({
    id: dockCommandIds.workspaceClose,
    title: "Close workspace item",
  }),
  workspaceActivate: createCommand<string>({
    id: dockCommandIds.workspaceActivate,
    title: "Activate workspace item",
  }),
} as const;

/**
 * Create platform command definitions for every built-in dock store method.
 *
 * @returns The static command metadata consumed by menus, shortcuts, and command
 * palettes.
 *
 * @example
 * ```ts
 * for (const command of createDockCommandDefinitions()) {
 *   platform.commands.register(command);
 * }
 * ```
 */
export function createDockCommandDefinitions(): CommandDefinition<any, any>[] {
  return Object.values(dockCommands);
}

/**
 * Register platform commands that call the store API.
 *
 * @param commands - Command registry that owns the command definitions and
 * handlers.
 * @param dock - Store instance that receives command execution.
 * @returns A disposable that unregisters all definitions and handlers.
 *
 * @example
 * ```ts
 * const disposable = registerDockCommands(platform.commands, dock);
 * disposable.dispose();
 * ```
 */
export function registerDockCommands(
  commands: CommandRegistrar,
  dock: DockStateStore,
): Disposable {
  const disposables: Disposable[] = [];

  for (const definition of createDockCommandDefinitions()) {
    disposables.push(commands.register(definition));
  }

  disposables.push(
    commands.registerHandler(dockCommands.toolWindowShow, (toolWindowId) => {
      dock.showToolWindow(toolWindowId);
    }),
    commands.registerHandler(dockCommands.toolWindowActivate, (toolWindowId) => {
      dock.activateToolWindow(toolWindowId);
    }),
    commands.registerHandler(dockCommands.toolWindowDeactivate, (toolWindowId) => {
      dock.deactivateToolWindow(toolWindowId);
    }),
    commands.registerHandler(dockCommands.toolWindowHide, (toolWindowId) => {
      dock.hideToolWindow(toolWindowId);
    }),
    commands.registerHandler(dockCommands.toolWindowToggle, (toolWindowId) => {
      dock.toggleToolWindow(toolWindowId);
    }),
    commands.registerHandler(
      dockCommands.toolWindowMove,
      (input) => {
        dock.moveToolWindow(input.toolWindowId, input.placement, input.index);
      },
    ),
    commands.registerHandler(dockCommands.toolWindowFloat, (input) => {
      dock.floatToolWindow(input.toolWindowId);
    }),
    commands.registerHandler(dockCommands.toolWindowDock, (input) => {
      dock.dockToolWindow(input.toolWindowId, input.placement, input.index);
    }),
    commands.registerHandler(
      dockCommands.toolWindowResize,
      (input) => {
        dock.resize(input.placement, input.size);
      },
    ),
    commands.registerHandler(
      dockCommands.regionResize,
      (input) => {
        dock.resizeRegion(input.region, input.size);
      },
    ),
    commands.registerHandler(dockCommands.workspaceOpen, (item) => {
      dock.openWorkspaceItem(item);
    }),
    commands.registerHandler(dockCommands.workspaceClose, (itemId) => {
      dock.closeWorkspaceItem(itemId);
    }),
    commands.registerHandler(dockCommands.workspaceActivate, (itemId) => {
      dock.activateWorkspaceItem(itemId);
    }),
  );

  return {
    dispose() {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    },
  };
}
