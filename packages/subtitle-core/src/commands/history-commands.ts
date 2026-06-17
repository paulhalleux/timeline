import {
  createCommand,
  type CommandDefinition,
  type Disposable,
  type MenuContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";

import type { TimedTextDocumentService } from "../documents/document-service";
import type { SubtitleHistoryState } from "../documents/events";
import type { SubtitlePlaybackState } from "../playback";
import type { SubtitleSelection } from "../selection";

interface CommandRegistrar {
  registerHandler<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    handler: (input: TInput) => TResult | Promise<TResult>,
  ): Disposable;
}

export interface SubtitleCommandContext {
  history?: SubtitleHistoryState;
  playback?: SubtitlePlaybackState;
  selection?: SubtitleSelection;
}

export const undoCommand = createCommand<void, void>({
  id: "edit.undo",
  title: "Undo",
  category: "Edit",
});

export const redoCommand = createCommand<void, void>({
  id: "edit.redo",
  title: "Redo",
  category: "Edit",
});

export const historyCommands = {
  undo: undoCommand,
  redo: redoCommand,
};

export const defaultHistoryCommands = Object.values(historyCommands);

export const defaultHistoryMenuContributions: MenuContribution<
  string,
  any,
  SubtitleCommandContext
>[] = [
  {
    menu: "main.edit",
    command: undoCommand,
    group: "History",
    order: 10,
    enabled: (context) => context.history?.canUndo ?? false,
  },
  {
    menu: "main.edit",
    command: redoCommand,
    group: "History",
    order: 20,
    enabled: (context) => context.history?.canRedo ?? false,
  },
];

export const defaultHistoryShortcutContributions: ShortcutContribution<
  any,
  SubtitleCommandContext
>[] = [
  {
    command: undoCommand,
    shortcut: "Mod+Z",
    preventDefault: true,
    source: "subtitle-core",
    enabled: (context) => context.history?.canUndo ?? false,
  },
  {
    command: redoCommand,
    shortcut: "Mod+Shift+Z",
    preventDefault: true,
    source: "subtitle-core",
    enabled: (context) => context.history?.canRedo ?? false,
  },
];

/**
 * Register undo/redo handlers against a timed-text document service.
 *
 * @example
 * ```ts
 * registerSubtitleHistoryCommandHandlers(commands, documents);
 * ```
 */
export function registerSubtitleHistoryCommandHandlers(
  registry: CommandRegistrar,
  documents: TimedTextDocumentService,
) {
  return [
    registry.registerHandler(undoCommand, () => {
      documents.undo();
    }),
    registry.registerHandler(redoCommand, () => {
      documents.redo();
    }),
  ];
}
