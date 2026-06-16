import {
  PlatformRuntime,
  defineCommand,
  type MenuContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";
import type { TimedTextDocumentService } from "@ptl/subtitle-core";

export interface SubtitleEditorCommandRegistration {
  platform: PlatformRuntime;
  menus: MenuContribution[];
  shortcuts: ShortcutContribution[];
  id: string;
  title: string;
  menu: string;
  group: string;
  shortcut?: string;
  run(): void | Promise<void>;
}

/**
 * Register an app-owned subtitle editing command with menu and shortcut metadata.
 *
 * Use this for commands that depend on the editor application shell rather than
 * belonging in `@ptl/subtitle-core`.
 *
 * @example
 * ```ts
 * registerSubtitleEditorCommand({
 *   platform,
 *   menus,
 *   shortcuts,
 *   id: "editor.timedText.sort",
 *   title: "Sort cues by time",
 *   menu: "main.cue",
 *   group: "Cue",
 *   run: () => platform.commands.execute(sortCuesByTimeCommand, undefined),
 * });
 * ```
 */
export function registerSubtitleEditorCommand({
  platform,
  menus,
  shortcuts,
  id,
  title,
  menu,
  group,
  shortcut,
  run,
}: SubtitleEditorCommandRegistration) {
  const command = defineCommand<void, void>({
    id,
    title,
    category: "Subtitle",
    keywords: [group, "timed-text"],
  });

  platform.commands.register(command);
  platform.commands.registerHandler(command, run);
  menus.push({ menu, command, group, order: 20 });

  if (shortcut) {
    shortcuts.push({ command, shortcut, preventDefault: true, source: "subtitle-editor" });
  }
}

/**
 * Count cues in the active timed-text document.
 *
 * @example
 * ```ts
 * const nextIndex = getCueCount(documents) + 1;
 * ```
 */
export function getCueCount(documents: TimedTextDocumentService): number {
  return documents.getCurrent()?.tracks.reduce((total, track) => total + track.cues.length, 0) ?? 0;
}
