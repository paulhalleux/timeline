import {
  PlatformRuntime,
  defineCommand,
  definePlugin,
  type MenuContribution,
  type MenuRootContribution,
  type PluginDefinition,
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

import { isToolWindowVisible } from "./dock-panel-menu";
import { getCueCount } from "./subtitle-editor-command";
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

const fileCommands = [
  { id: "editor.file.new", title: "New project", shortcut: "Mod+N" },
  { id: "editor.file.open", title: "Open", shortcut: "Mod+O" },
  { id: "editor.file.save", title: "Save", shortcut: "Mod+S" },
].map((input) => ({
  ...input,
  command: defineCommand<void, void>({
    id: input.id,
    title: input.title,
    category: "Editor",
    keywords: ["Project"],
  }),
}));

const commandPaletteCommand = defineCommand<void, void>({
  id: "editor.commandPalette.toggle",
  title: "Show command palette",
  category: "View",
  keywords: ["palette", "commands", "search"],
});

const insertSampleCueCommand = defineCommand<void, void>({
  id: "editor.timedText.insertSampleCue",
  title: "Insert sample cue",
  category: "Subtitle",
  keywords: ["Cue", "timed-text"],
});

const sortTimedTextCommand = defineCommand<void, void>({
  id: "editor.timedText.sort",
  title: "Sort cues by time",
  category: "Subtitle",
  keywords: ["Cue", "timed-text"],
});

const snapTimedText24Command = defineCommand<void, void>({
  id: "editor.timedText.snap24",
  title: "Snap cues to 24 fps",
  category: "Subtitle",
  keywords: ["Timing", "timed-text"],
});

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
].map((input) => ({
  ...input,
  command: defineCommand<void, void>({
    id: input.id,
    title: input.title,
    category: "View",
  }),
}));

export interface EditorPlatformSetup {
  platform: PlatformRuntime;
}

export interface EditorPlatformOptions {
  documents: TimedTextDocumentService;
  playback: SubtitlePlaybackService;
  selection: DefaultSubtitleSelectionService;
  dock: DockStateStore;
  contextRef: React.RefObject<EditorCommandContext | null>;
  commandPaletteRef: React.RefObject<{ toggle(): void } | null>;
}

export function createEditorPlatform(options: EditorPlatformOptions): EditorPlatformSetup {
  const platform = new PlatformRuntime();
  const plugins = createEditorPlugins(options);

  for (const plugin of plugins) {
    platform.registerPlugin(plugin);
  }

  for (const plugin of platform.resolveActivationOrder()) {
    void platform.activatePlugin(plugin.id);
  }

  return { platform };
}

function createEditorPlugins({
  documents,
  playback,
  selection,
  dock,
  contextRef,
  commandPaletteRef,
}: EditorPlatformOptions): PluginDefinition[] {
  return [
    definePlugin({
      id: "editor.shell",
      displayName: "Editor shell",
      contributes: {
        menuRoots: editorMenuRoots,
      },
    }),
    definePlugin({
      id: "editor.subtitle-defaults",
      displayName: "Subtitle defaults",
      contributes: {
        commands: defaultSubtitleCommands,
        menus: defaultSubtitleMenuContributions as MenuContribution[],
        shortcuts: defaultSubtitleShortcutContributions as ShortcutContribution[],
      },
      activate: ({ commands }) => {
        registerDefaultSubtitleCommandHandlers(
          commands,
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
      },
    }),
    definePlugin({
      id: "editor.files",
      displayName: "Editor file commands",
      contributes: {
        commands: fileCommands.map((entry) => entry.command),
        menus: fileCommands.map(({ command }) => ({
          menu: "main.file",
          command,
          group: "Project",
          order: 10,
        })),
        shortcuts: fileCommands.map(({ command, shortcut }) => ({
          command,
          shortcut,
          preventDefault: true,
          source: "editor",
        })),
      },
      activate: ({ commands }) => {
        for (const { command, title } of fileCommands) {
          commands.registerHandler(command, () => {
            contextRef.current?.notify(`${title} triggered.`);
          });
        }
      },
    }),
    definePlugin({
      id: "editor.command-palette",
      displayName: "Editor command palette",
      contributes: {
        commands: [commandPaletteCommand],
        menus: [{ menu: "main.view", command: commandPaletteCommand, group: "Window", order: 5 }],
        shortcuts: [
          {
            command: commandPaletteCommand,
            shortcut: "Mod+Shift+P",
            preventDefault: true,
            source: "editor",
          },
        ],
      },
      activate: ({ commands }) => {
        commands.registerHandler(commandPaletteCommand, () => {
          commandPaletteRef.current?.toggle();
        });
      },
    }),
    definePlugin({
      id: "editor.timed-text",
      displayName: "Editor timed-text commands",
      contributes: {
        commands: [insertSampleCueCommand, sortTimedTextCommand, snapTimedText24Command],
        menus: [
          { menu: "main.cue", command: insertSampleCueCommand, group: "Cue", order: 20 },
          { menu: "main.cue", command: sortTimedTextCommand, group: "Cue", order: 20 },
          { menu: "main.timing", command: snapTimedText24Command, group: "Timing", order: 20 },
        ],
        shortcuts: [
          {
            command: insertSampleCueCommand,
            shortcut: "Mod+Enter",
            preventDefault: true,
            source: "subtitle-editor",
          },
          {
            command: snapTimedText24Command,
            shortcut: "Mod+Shift+K",
            preventDefault: true,
            source: "subtitle-editor",
          },
        ],
      },
      activate: ({ commands }) => {
        commands.registerHandler(insertSampleCueCommand, async () => {
          const count = getCueCount(documents);
          const cue = createEditorCue(
            {
              startMs: count * 2_000,
              endMs: count * 2_000 + 1_500,
              text: `Sample subtitle ${count + 1}`,
            },
            (prefix) => `${prefix}-${count + 1}`,
          );

          await commands.execute(insertCueCommand, {
            trackId: "subtitles",
            cue,
          });
        });
        commands.registerHandler(sortTimedTextCommand, async () => {
          await commands.execute(sortCuesByTimeCommand, undefined);
        });
        commands.registerHandler(snapTimedText24Command, async () => {
          await commands.execute(snapCuesToFramesCommand, { frameRate: 24 });
        });
      },
    }),
    definePlugin({
      id: "editor.view-panels",
      displayName: "Editor view panels",
      contributes: {
        commands: editorPanelToggles.map((entry) => entry.command),
        menus: [
          {
            kind: "submenu",
            menu: "main.view",
            submenu: "main.view.panels",
            label: "Panels",
            group: "Window",
            order: 10,
          },
          ...editorPanelToggles.map(({ command, toolWindowId, order }) => ({
            kind: "toggle" as const,
            menu: "main.view.panels",
            command,
            checked: () => isToolWindowVisible(dock, toolWindowId),
            group: "Panels",
            order,
          })),
        ],
      },
      activate: ({ commands }) => {
        for (const { command, toolWindowId } of editorPanelToggles) {
          commands.registerHandler(command, () => {
            dock.toggleToolWindow(toolWindowId);
          });
        }
      },
    }),
  ];
}
