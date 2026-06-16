import {
  defineCommand,
  type CommandRegistry,
  type MenuContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";

import type {
  SeekPlaybackInput,
  SetPlaybackRateInput,
  SubtitlePlaybackService,
  SubtitlePlaybackState,
} from "../playback";
import type { SubtitleCommandContext } from "./history-commands";

export const playCommand = defineCommand<void, SubtitlePlaybackState>({
  id: "playback.play",
  title: "Play",
  category: "Playback",
});

export const pauseCommand = defineCommand<void, SubtitlePlaybackState>({
  id: "playback.pause",
  title: "Pause",
  category: "Playback",
});

export const togglePlaybackCommand = defineCommand<void, SubtitlePlaybackState>({
  id: "playback.toggle",
  title: "Play/Pause",
  category: "Playback",
});

export const seekPlaybackCommand = defineCommand<SeekPlaybackInput, SubtitlePlaybackState>({
  id: "playback.seek",
  title: "Seek playback",
  category: "Playback",
});

export const setPlaybackRateCommand = defineCommand<
  SetPlaybackRateInput,
  SubtitlePlaybackState
>({
  id: "playback.setRate",
  title: "Set playback rate",
  category: "Playback",
});

export const playbackCommands = {
  play: playCommand,
  pause: pauseCommand,
  toggle: togglePlaybackCommand,
  seek: seekPlaybackCommand,
  setRate: setPlaybackRateCommand,
};

export const defaultPlaybackCommands = Object.values(playbackCommands);

export const defaultPlaybackMenuContributions: MenuContribution<
  string,
  any,
  SubtitleCommandContext
>[] = [
  {
    kind: "toggle",
    menu: "main.playback",
    command: togglePlaybackCommand,
    label: "Play/Pause",
    group: "Transport",
    order: 10,
    checked: (context) => context.playback?.status === "playing",
  },
];

export const defaultPlaybackShortcutContributions: ShortcutContribution<
  any,
  SubtitleCommandContext
>[] = [
  {
    command: togglePlaybackCommand,
    shortcut: "Space",
    preventDefault: true,
    source: "subtitle-core",
  },
];

/**
 * Register playback handlers against the pure subtitle playback service.
 *
 * @example
 * ```ts
 * const playback = new SubtitlePlaybackService();
 * registerSubtitlePlaybackCommandHandlers(commands, playback);
 * ```
 */
export function registerSubtitlePlaybackCommandHandlers(
  registry: CommandRegistry,
  playback: SubtitlePlaybackService,
) {
  return [
    registry.registerHandler(playCommand, () => playback.play()),
    registry.registerHandler(pauseCommand, () => playback.pause()),
    registry.registerHandler(togglePlaybackCommand, () => playback.toggle()),
    registry.registerHandler(seekPlaybackCommand, (input) => playback.seek(input)),
    registry.registerHandler(setPlaybackRateCommand, (input) => playback.setRate(input)),
  ];
}
