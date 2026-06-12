import { useCallback, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  ActionDescriptor,
  ActionInvocation,
  ActionRunResult,
} from "@ptl/action-core";
import type { ActionRunner } from "./action-runner";
import { useActionRunner } from "./action-context";
import { createActionContextMenuItems } from "./context-menu-items";
import {
  closedActionContextMenuState,
  type ActionContextMenuState,
} from "./context-menu-state";

export interface UseActionContextMenuOptions {
  actions?: readonly ActionDescriptor[];
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
 * the clicked DOM target so ActionScope can resolve the active surface.
 */
export function useActionContextMenu(
  runner?: ActionRunner,
  options: UseActionContextMenuOptions = {},
): UseActionContextMenuResult {
  const resolvedRunner = useActionRunner(runner);
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
      });
    },
    [],
  );

  const close = useCallback(() => {
    setMenu(closedActionContextMenuState);
  }, []);

  const invocation = useMemo<ActionInvocation>(
    () => ({
      source: "contextMenu",
      event: menu.event,
      target: menu.target,
    }),
    [menu.event, menu.target],
  );

  const items = useMemo(
    () =>
      menu.open
        ? createActionContextMenuItems(
            resolvedRunner,
            invocation,
            options.actions,
          )
        : [],
    [invocation, menu.open, options.actions, resolvedRunner],
  );

  const run = useCallback(
    async (action: ActionDescriptor) => {
      const payload = options.getPayload?.(action, menu);
      const result = await resolvedRunner.run(action.id, {
        ...invocation,
        ...(payload === undefined ? {} : { payload }),
      });
      close();
      return result;
    },
    [close, invocation, menu, options, resolvedRunner],
  );

  return { menu, items, onContextMenu, close, run };
}
