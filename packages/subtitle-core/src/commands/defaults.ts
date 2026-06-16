import {
  defaultHistoryCommands,
  defaultHistoryMenuContributions,
  defaultHistoryShortcutContributions,
  historyCommands,
  registerSubtitleHistoryCommandHandlers,
} from "./history-commands";
import {
  defaultPlaybackCommands,
  defaultPlaybackMenuContributions,
  defaultPlaybackShortcutContributions,
  playbackCommands,
  registerSubtitlePlaybackCommandHandlers,
} from "./playback-commands";
import {
  cueCommands,
  defaultCueCommands,
  defaultCueMenuContributions,
  defaultCueShortcutContributions,
  registerTimedTextCueCommandHandlers,
} from "./cue-commands";
import {
  defaultTimingCommands,
  defaultTimingMenuContributions,
  registerTimedTextTimingCommandHandlers,
  timingCommands,
} from "./timing-commands";
import type { CommandRegistry } from "@ptl/platform-core";
import type { TimedTextDocumentService } from "../documents/document-service";
import type { SubtitlePlaybackService } from "../playback";
import type { TimedTextCommandContext } from "./context";

export const timedTextCommands = {
  ...cueCommands,
  ...timingCommands,
};

export const subtitleCommands = {
  ...historyCommands,
  ...playbackCommands,
  ...timedTextCommands,
};

export const defaultTimedTextCommands = [...defaultCueCommands, ...defaultTimingCommands];

export const defaultSubtitleCommands = [
  ...defaultHistoryCommands,
  ...defaultPlaybackCommands,
  ...defaultTimedTextCommands,
];

export const defaultTimedTextMenuContributions = [
  ...defaultCueMenuContributions,
  ...defaultTimingMenuContributions,
];

export const defaultSubtitleMenuContributions = [
  ...defaultHistoryMenuContributions,
  ...defaultPlaybackMenuContributions,
  ...defaultTimedTextMenuContributions,
];

export const defaultTimedTextShortcutContributions = [...defaultCueShortcutContributions];

export const defaultSubtitleShortcutContributions = [
  ...defaultHistoryShortcutContributions,
  ...defaultPlaybackShortcutContributions,
  ...defaultTimedTextShortcutContributions,
];

/**
 * Register built-in pure operation handlers for the default timed-text commands.
 *
 * Apps that need history, collaboration, or persistence can skip this helper
 * and register their own handlers against the same command definitions.
 */
export function registerDefaultTimedTextCommandHandlers(
  registry: CommandRegistry,
  context: TimedTextCommandContext,
) {
  return [
    ...registerTimedTextCueCommandHandlers(registry, context),
    ...registerTimedTextTimingCommandHandlers(registry, context),
  ];
}

export function registerDefaultSubtitleCommandHandlers(
  registry: CommandRegistry,
  context: TimedTextCommandContext,
  documents: TimedTextDocumentService,
  playback?: SubtitlePlaybackService,
) {
  const disposables = [
    ...registerSubtitleHistoryCommandHandlers(registry, documents),
    ...registerDefaultTimedTextCommandHandlers(registry, context),
  ];

  if (playback) {
    disposables.push(...registerSubtitlePlaybackCommandHandlers(registry, playback));
  }

  return disposables;
}
