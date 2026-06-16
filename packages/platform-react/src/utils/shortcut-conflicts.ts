import type { ShortcutContribution } from "@ptl/platform-core";

export interface ShortcutConflict<TContext = unknown> {
  shortcut: string;
  contributions: readonly ShortcutContribution<any, TContext>[];
}

export function findShortcutConflicts<TContext>(
  contributions: readonly ShortcutContribution<any, TContext>[],
) {
  const byShortcut = new Map<string, ShortcutContribution<any, TContext>[]>();
  for (const contribution of contributions) {
    const key = contribution.shortcut.toLowerCase();
    byShortcut.set(key, [...(byShortcut.get(key) ?? []), contribution]);
  }

  return [...byShortcut.entries()]
    .filter(([, matching]) => matching.length > 1)
    .map(([shortcut, matching]) => ({ shortcut, contributions: matching }));
}
