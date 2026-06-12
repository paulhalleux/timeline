import { useMemo } from "react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import type { ActionRunner } from "./action-runner";
import { useActionRunner, useCurrentActionSurface } from "./action-context";
import {
  createActionHotkeyDefinitions,
  type ActionHotkeyOptions,
} from "./hotkey-definitions";

/**
 * Registers action keybindings with TanStack Hotkeys.
 *
 * When used inside an `Actions.Surface`, the hook automatically targets that
 * surface element and does not pass a `surfaceId` to action invocation. The
 * action scope resolves the surface from the keyboard event target.
 */
export function useActionHotkeys(
  runner?: ActionRunner,
  options: ActionHotkeyOptions = {},
): void {
  const resolvedRunner = useActionRunner(runner);
  const surface = useCurrentActionSurface();
  const definitions = useMemo(
    () =>
      createActionHotkeyDefinitions(resolvedRunner, {
        ...options,
        focus: options.focus ?? (surface ? "surface" : "global"),
        surfaceId: options.surfaceId ?? surface?.id,
        target: options.target ?? surface?.element ?? undefined,
      }),
    [options, resolvedRunner, surface],
  );

  useHotkeys(definitions);
}
