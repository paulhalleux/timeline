import "./tanstack-hotkeys-meta";
import type {
  ActionDescriptor,
  ActionInvocation,
  ActionRunResult,
} from "@ptl/action-core";
import type {
  UseHotkeyDefinition,
  UseHotkeyOptions,
} from "@tanstack/react-hotkeys";
import type { ActionRunner } from "./action-runner";

export interface ActionHotkeyOptions {
  actions?: readonly ActionDescriptor[];
  enabled?: boolean;
  scopeElementId?: string;
  target?: UseHotkeyOptions["target"];
  getPayload?: (action: ActionDescriptor, event: KeyboardEvent) => unknown;
}

/**
 * Converts action keybinding metadata into TanStack `useHotkeys` definitions.
 */
export function createActionHotkeyDefinitions(
  runner: ActionRunner,
  options: ActionHotkeyOptions = {},
): UseHotkeyDefinition[] {
  const definitions: UseHotkeyDefinition[] = [];
  const actions = options.actions ?? runner.list();

  for (const action of actions) {
    for (const keybinding of action.keybindings ?? []) {
      const keys = Array.isArray(keybinding.keys)
        ? keybinding.keys
        : [keybinding.keys];

      for (const key of keys) {
        definitions.push({
          hotkey: key,
          callback: (event) => {
            void runner.run(
              action.id,
              createShortcutInvocation(action, event, options),
            );
          },
          options: {
            enabled:
              (options.enabled ?? true) &&
              (runner.getState?.(action.id).enabled ?? true),
            preventDefault: keybinding.preventDefault,
            stopPropagation: keybinding.stopPropagation,
            platform:
              keybinding.platform === "all" ? undefined : keybinding.platform,
            target: options.target,
            meta: {
              name: action.title,
              description: action.description,
              group: action.category,
              actionId: action.id,
              scope: keybinding.scope,
            },
          },
        });
      }
    }
  }

  return definitions;
}

function createShortcutInvocation(
  action: ActionDescriptor,
  event: KeyboardEvent,
  options: ActionHotkeyOptions,
): ActionInvocation {
  const payload = options.getPayload?.(action, event);

  if (payload === undefined) {
    return {
      source: "shortcut",
      event,
      target: event.target,
      scopeElementId: options.scopeElementId,
    };
  }

  return {
    source: "shortcut",
    event,
    target: event.target,
    scopeElementId: options.scopeElementId,
    payload,
  };
}

export type ActionHotkeyRunResult = Promise<ActionRunResult>;
