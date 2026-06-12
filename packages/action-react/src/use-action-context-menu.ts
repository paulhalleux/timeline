import { useCallback, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  ActionDescriptor,
  ActionInvocation,
  ActionRunResult,
} from "@ptl/action-core";
import type { ActionRunner } from "./action-runner";
import { createActionContextMenuItems } from "./context-menu-items";
import {
  closedActionContextMenuState,
  type ActionContextMenuState,
} from "./context-menu-state";

export interface UseActionContextMenuOptions {
  actions?: readonly ActionDescriptor[];
  surfaceId?: string;
  getPayload?: (
    action: ActionDescriptor,
    state: ActionContextMenuState,
  ) => unknown;
}

export interface UseActionContextMenuResult {
  menu: ActionContextMenuState;
  items: ReturnType<typeof createActionContextMenuItems>;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  close: () => void;
  run: (action: ActionDescriptor) => Promise<ActionRunResult>;
}

/**
 * Headless React context-menu controller for actions.
 *
 * Render `items` however your UI library expects; calling `run(item.action)`
 * invokes the action with source `contextMenu`, the original mouse event, and
 * the registered action surface id when provided.
 */
export function useActionContextMenu(
  runner: ActionRunner,
  options: UseActionContextMenuOptions = {},
): UseActionContextMenuResult {
  const [menu, setMenu] = useState<ActionContextMenuState>(
    closedActionContextMenuState,
  );

  const onContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
      setMenu({
        open: true,
        x: event.clientX,
        y: event.clientY,
        event: event.nativeEvent,
        target: event.target,
        surfaceId: options.surfaceId,
      });
    },
    [options.surfaceId],
  );

  const close = useCallback(() => {
    setMenu(closedActionContextMenuState);
  }, []);

  const invocation = useMemo<ActionInvocation>(
    () => ({
      source: "contextMenu",
      event: menu.event,
      target: menu.target,
      surfaceId: menu.surfaceId,
    }),
    [menu.event, menu.surfaceId, menu.target],
  );

  const items = useMemo(
    () =>
      menu.open
        ? createActionContextMenuItems(runner, invocation, options.actions)
        : [],
    [invocation, menu.open, options.actions, runner],
  );

  const run = useCallback(
    async (action: ActionDescriptor) => {
      const payload = options.getPayload?.(action, menu);
      const result = await runner.run(action.id, {
        ...invocation,
        ...(payload === undefined ? {} : { payload }),
      });
      close();
      return result;
    },
    [close, invocation, menu, options, runner],
  );

  return { menu, items, onContextMenu, close, run };
}
