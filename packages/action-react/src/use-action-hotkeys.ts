import { useMemo } from "react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import type { ActionRunner } from "./action-runner";
import {
  createActionHotkeyDefinitions,
  type ActionHotkeyOptions,
} from "./hotkey-definitions";

/**
 * Registers action keybindings with TanStack Hotkeys.
 *
 * This hook intentionally uses TanStack's plural `useHotkeys` API because the
 * action list is dynamic and may come from host apps or plugins.
 */
export function useActionHotkeys(
  runner: ActionRunner,
  options: ActionHotkeyOptions = {},
): void {
  const definitions = useMemo(
    () => createActionHotkeyDefinitions(runner, options),
    [runner, options],
  );

  useHotkeys(definitions);
}
