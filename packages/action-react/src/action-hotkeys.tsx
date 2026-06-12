import type { ActionHotkeyOptions } from "./hotkey-definitions";
import type { ActionRunner } from "./action-runner";
import { useActionHotkeys } from "./use-action-hotkeys";

export interface ActionHotkeysProps extends ActionHotkeyOptions {
  runner?: ActionRunner;
}

export function ActionHotkeys(props: ActionHotkeysProps) {
  const { runner, ...options } = props;
  useActionHotkeys(runner, options);
  return null;
}
