import "./tanstack-hotkeys-meta";
import type {
  ActionDescriptor,
  ActionFocusRequirement,
  ActionInvocation,
  ActionRunResult,
} from "@ptl/action-core";
import type {
  UseHotkeyDefinition,
  UseHotkeyOptions,
} from "@tanstack/react-hotkeys";
import type { ActionRunner } from "./action-runner";

export type ActionHotkeyFocus = "all" | "global" | "surface";

export interface ActionHotkeyOptions {
  actions?: readonly ActionDescriptor[];
  enabled?: boolean;
  /**
   * Controls which shortcut actions are bound by this adapter.
   *
   * - `global`: actions that do not require a surface.
   * - `surface`: actions that should run inside an active/focused surface.
   * - `all`: no focus-based filtering.
   */
  focus?: ActionHotkeyFocus;
  /** Surface id used only to filter surface-specific hotkey bindings. */
  surfaceId?: string;
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
    if (!matchesHotkeyFocus(action, options)) continue;

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
            stopPropagation:
              keybinding.stopPropagation ?? options.focus === "surface",
            platform:
              keybinding.platform === "all" ? undefined : keybinding.platform,
            target: options.target,
            meta: {
              name: action.title,
              description: action.description,
              group: action.category,
              actionId: action.id,
              hotkeyScope: keybinding.hotkeyScope,
            },
          },
        });
      }
    }
  }

  return definitions;
}

function matchesHotkeyFocus(
  action: ActionDescriptor,
  options: ActionHotkeyOptions,
): boolean {
  const focus = options.focus ?? "all";
  if (focus === "all") return true;

  const requirement = action.triggerFocus?.shortcut ?? "optional";
  if (focus === "global") {
    return requirement === "none" || requirement === "optional";
  }
  return isSurfaceRequirementMatched(requirement, options.surfaceId);
}

function isSurfaceRequirementMatched(
  requirement: ActionFocusRequirement,
  surfaceId: string | undefined,
): boolean {
  if (requirement === "none" || requirement === "optional") return false;
  if (requirement === "required") return true;
  return surfaceId === undefined || requirement.surfaceId === surfaceId;
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
    };
  }

  return {
    source: "shortcut",
    event,
    target: event.target,
    payload,
  };
}

export type ActionHotkeyRunResult = Promise<ActionRunResult>;
