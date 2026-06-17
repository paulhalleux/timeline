import {
  PlatformRuntime,
  defineCommand,
  type CommandDefinition,
  type MenuContribution,
  type MenuRootContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";
import {
  DefaultSubtitleSelectionService,
  SubtitlePlaybackService,
  TimedTextDocumentService,
  defaultSubtitleCommands,
  defaultSubtitleMenuContributions,
  defaultSubtitleShortcutContributions,
  insertCueCommand,
  registerDefaultSubtitleCommandHandlers,
  snapCuesToFramesCommand,
  sortCuesByTimeCommand,
} from "@ptl/subtitle-core";
import { createEditorCue } from "@ptl/timed-text-core";
import type { DockStateStore } from "@ptl/dock-core";
import type React from "react";

import { getCueCount, registerSubtitleEditorCommand } from "./subtitle-editor-command";
import { registerDockPanelToggle } from "./dock-panel-menu";
import { editorDockToolWindowIds } from "../dock/editor-dock";

interface EditorCommandContext {
  notify(message: string): void;
}

const editorMenuRoots: MenuRootContribution[] = [
  { menu: "main.file", label: "File", order: 10 },
  { menu: "main.edit", label: "Edit", order: 20 },
  { menu: "main.cue", label: "Cue", order: 30 },
  { menu: "main.timing", label: "Timing", order: 40 },
  { menu: "main.playback", label: "Playback", order: 50 },
  { menu: "main.view", label: "View", order: 60 },
];

const editorPanelToggles = [
  {
    id: "editor.view.toggleOutline",
    title: "Outline",
    toolWindowId: editorDockToolWindowIds.outline,
    order: 10,
  },
  {
    id: "editor.view.toggleTracks",
    title: "Tracks",
    toolWindowId: editorDockToolWindowIds.tracks,
    order: 20,
  },
  {
    id: "editor.view.toggleInspector",
    title: "Inspector",
    toolWindowId: editorDockToolWindowIds.inspector,
    order: 30,
  },
  {
    id: "editor.view.toggleQuality",
    title: "QC",
    toolWindowId: editorDockToolWindowIds.quality,
    order: 40,
  },
  {
    id: "editor.view.togglePlayback",
    title: "Playback",
    toolWindowId: editorDockToolWindowIds.playback,
    order: 50,
  },
  {
    id: "editor.view.toggleTimeline",
    title: "Timeline",
    toolWindowId: editorDockToolWindowIds.timeline,
    order: 60,
  },
] as const;

export interface EditorPlatformSetup {
  platform: PlatformRuntime;
  menuRoots: MenuRootContribution[];
  menus: MenuContribution[];
  shortcuts: ShortcutContribution[];
}

export interface EditorPlatformOptions {
  documents: TimedTextDocumentService;
  playback: SubtitlePlaybackService;
  selection: DefaultSubtitleSelectionService;
  dock: DockStateStore;
  contextRef: React.RefObject<EditorCommandContext | null>;
  commandPaletteRef: React.RefObject<{ toggle(): void } | null>;
}

/**
 * Compose platform commands, menus, shortcuts, and app-owned timed-text state.
 *
 * The timed-text command bridge lives in the app because it depends on
 * `platform-core`; `@ptl/timed-text-core` remains pure model/operation code.
 *
 * @example
 * ```ts
 * const setup = createEditorPlatform({ documents, contextRef });
 * ```
 */
export function createEditorPlatform({
  documents,
  playback,
  selection,
  dock,
  contextRef,
  commandPaletteRef,
}: EditorPlatformOptions): EditorPlatformSetup {
  const platform = new PlatformRuntime();
  const menuRoots = [...editorMenuRoots];
  const menus: MenuContribution[] = [];
  const shortcuts: ShortcutContribution[] = [];

  for (const command of defaultSubtitleCommands) {
    platform.commands.register(command);
  }

  registerDefaultSubtitleCommandHandlers(
    platform.commands,
    {
      getDocument: () => documents.getCurrentOrThrow(),
      commitOperationResult: (input) => {
        const data = documents.commitOperationResult(input);
        contextRef.current?.notify(`Document now has ${getCueCount(documents)} cue(s).`);
        return data;
      },
      createId: (prefix) => `${prefix}-${getCueCount(documents) + 1}`,
      selection,
    },
    documents,
    playback,
  );
  menus.push(...(defaultSubtitleMenuContributions as MenuContribution[]));
  shortcuts.push(...(defaultSubtitleShortcutContributions as ShortcutContribution[]));

  const notifyCommand = (
    id: string,
    title: string,
    menu: string,
    group: string,
    shortcut?: string,
  ): CommandDefinition<void, void> => {
    const command = defineCommand<void, void>({
      id,
      title,
      category: "Editor",
      keywords: [group],
    });
    platform.commands.register(command);
    platform.commands.registerHandler(command, () => {
      contextRef.current?.notify(`${title} triggered.`);
    });
    menus.push({ menu, command, group, order: 10 });
    if (shortcut) {
      shortcuts.push({ command, shortcut, preventDefault: true, source: "editor" });
    }
    return command;
  };

  notifyCommand("editor.file.new", "New project", "main.file", "Project", "Mod+N");
  notifyCommand("editor.file.open", "Open", "main.file", "Project", "Mod+O");
  notifyCommand("editor.file.save", "Save", "main.file", "Project", "Mod+S");
  menus.push({
    kind: "submenu",
    menu: "main.view",
    submenu: "main.view.panels",
    label: "Panels",
    group: "Window",
    order: 10,
  });

  const commandPaletteCommand = defineCommand<void, void>({
    id: "editor.commandPalette.toggle",
    title: "Show command palette",
    category: "View",
    keywords: ["palette", "commands", "search"],
  });
  platform.commands.register(commandPaletteCommand);
  platform.commands.registerHandler(commandPaletteCommand, () => {
    commandPaletteRef.current?.toggle();
  });
  menus.push({ menu: "main.view", command: commandPaletteCommand, group: "Window", order: 5 });
  shortcuts.push({ command: commandPaletteCommand, shortcut: "Mod+Shift+P", preventDefault: true, source: "editor" });

  registerSubtitleEditorCommand({
    platform,
    menus,
    shortcuts,
    id: "editor.timedText.insertSampleCue",
    title: "Insert sample cue",
    menu: "main.cue",
    group: "Cue",
    shortcut: "Mod+Enter",
    run: async () => {
      const count = getCueCount(documents);
      const cue = createEditorCue(
        {
          startMs: count * 2_000,
          endMs: count * 2_000 + 1_500,
          text: `Sample subtitle ${count + 1}`,
        },
        (prefix) => `${prefix}-${count + 1}`,
      );

      await platform.commands.execute(insertCueCommand, {
        trackId: "subtitles",
        cue,
      });
    },
  });

  registerSubtitleEditorCommand({
    platform,
    menus,
    shortcuts,
    id: "editor.timedText.sort",
    title: "Sort cues by time",
    menu: "main.cue",
    group: "Cue",
    run: async () => {
      await platform.commands.execute(sortCuesByTimeCommand, undefined);
    },
  });

  registerSubtitleEditorCommand({
    platform,
    menus,
    shortcuts,
    id: "editor.timedText.snap24",
    title: "Snap cues to 24 fps",
    menu: "main.timing",
    group: "Timing",
    shortcut: "Mod+Shift+K",
    run: async () => {
      await platform.commands.execute(snapCuesToFramesCommand, { frameRate: 24 });
    },
  });

  for (const panel of editorPanelToggles) {
    registerDockPanelToggle({
      platform,
      menus,
      dock,
      ...panel,
    });
  }

  return { platform, menuRoots, menus, shortcuts };
}
