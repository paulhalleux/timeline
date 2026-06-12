import type { ActionDefinition, ActionId, ActionShortcut } from "./definition";

/**
 * Error thrown when two actions claim the same normalized shortcut.
 *
 * @example
 * ```ts
 * throw new ShortcutConflictError("Shortcut Mod+S is already used.");
 * ```
 */
export class ShortcutConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShortcutConflictError";
  }
}

/**
 * Normalize a shortcut string for lookup.
 *
 * The function keeps display strings flexible while making shortcut comparison
 * deterministic. It removes whitespace and lowercases all keys.
 *
 * @param shortcut - Shortcut string from an action descriptor.
 * @returns Normalized shortcut key.
 *
 * @example
 * ```ts
 * normalizeShortcut("Mod + Shift + P"); // "mod+shift+p"
 * ```
 */
export function normalizeShortcut(shortcut: ActionShortcut): string {
  return shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .join("+");
}

/**
 * Build a lookup table from normalized shortcuts to action ids.
 *
 * @param actions - Action definitions whose descriptors may include shortcuts.
 * @returns Map keyed by normalized shortcut.
 *
 * @example
 * ```ts
 * const shortcutMap = createShortcutMap([saveAction]);
 * shortcutMap.get("mod+s"); // "editor.file.save"
 * ```
 */
export function createShortcutMap(actions: ActionDefinition[]): Map<string, ActionId> {
  const shortcuts = new Map<string, ActionId>();

  for (const action of actions) {
    for (const shortcut of action.descriptor.shortcuts ?? []) {
      const normalizedShortcut = normalizeShortcut(shortcut);
      const existingActionId = shortcuts.get(normalizedShortcut);

      if (existingActionId && existingActionId !== action.descriptor.id) {
        throw new ShortcutConflictError(
          `Shortcut ${shortcut} is already used by ${existingActionId} and cannot be assigned to ${action.descriptor.id}.`,
        );
      }

      shortcuts.set(normalizedShortcut, action.descriptor.id);
    }
  }

  return shortcuts;
}
