import {
  createApplication,
  createCommand,
  createPlugin,
  type CommandDefinition,
  type MenuContribution,
  type MenuRootContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";
import { CommandPalette, PlatformProvider, ShortcutProvider } from "@ptl/platform-react";
import { useStore } from "@ptl/store/react";
import {
  DefaultSubtitleSelectionService,
  SubtitlePlaybackService,
  TimedTextDocumentService,
  defaultSubtitleCommands,
  defaultSubtitleMenuContributions,
  defaultSubtitleShortcutContributions,
  type SubtitleCommandContext,
} from "@ptl/subtitle-core";
import { createEditorDocument } from "@ptl/timed-text-core";
import { TooltipProvider } from "@ptl/ui";
import { Bug, Captions, ChartGantt, Gauge, ListTree, Rows3 } from "lucide-react";
import React from "react";

import { createEditorPlugins } from "../../application/create-editor-application";
import { createEditorDock, editorDockToolWindowIds } from "../../dock/editor-dock";
import { EditorDockServicesProvider } from "../../dock/editor-services-context";
import { EditorDockToolbar } from "../../dock/dock-toolbar";
import { DocumentStatus } from "./document-status";
import { AppMenubar } from "./menu-bar";
import { DockDragDropContext, DockProvider, DockResolvedLayout } from "@ptl/dock-react";

interface EditorCommandContext {
  notify(message: string): void;
}

export const App = () => {
  const contextRef = React.useRef<EditorCommandContext | null>(null);
  const commandPaletteRef = React.useRef<{ toggle(): void } | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const documents = React.useMemo(() => {
    const service = new TimedTextDocumentService();
    service.open(
      createEditorDocument({
        id: "subtitle-editor-demo",
        format: "vtt",
        tracks: [{ id: "subtitles", kind: "subtitle", cues: [] }],
      }),
    );
    return service;
  }, []);
  const playback = React.useMemo(() => new SubtitlePlaybackService({ durationMs: 60_000 }), []);
  const selection = React.useMemo(() => new DefaultSubtitleSelectionService(), []);
  const dock = React.useMemo(() => createEditorDock(), []);
  const historyState = useStore(documents.getHistoryStore());
  const playbackState = useStore(playback.getStore());
  const selectionState = useStore(selection.getStore());
  const platformContext = React.useMemo<SubtitleCommandContext>(
    () => ({ history: historyState, playback: playbackState, selection: selectionState }),
    [historyState, playbackState, selectionState],
  );
  const editorUi = React.useMemo(
    () => createEditorUiPlugin(dock.store, commandPaletteRef, contextRef),
    [dock.store],
  );
  const application = React.useMemo(
    () => createApplication({ plugins: [...createEditorPlugins(), editorUi.plugin] }),
    [editorUi.plugin],
  );
  const contributions = editorUi.contributions;

  contextRef.current = {
    notify: (message) => {
      alert(`Command executed!\n\n${message}`);
    },
  };

  commandPaletteRef.current = {
    toggle: () => setCommandPaletteOpen((prev) => !prev),
  };

  React.useEffect(() => {
    let disposed = false;
    void application.platform.start().catch((error) => {
      if (!disposed) console.error(error);
    });
    return () => {
      disposed = true;
      void application.platform.dispose();
    };
  }, [application]);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <PlatformProvider
        platform={application.platform}
        components={dock.components}
        contributions={contributions}
      >
        <ShortcutProvider context={platformContext}>
          <TooltipProvider>
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
            <DockProvider store={dock.store}>
              <EditorDockServicesProvider services={{ documents, playback, selection }}>
                <AppMenubar context={platformContext} />
                <DockDragDropContext
                  renderDragPreview={(toolWindow) => {
                    const toolbarItem = toolbarItems.find((item) => item.id === toolWindow.id);
                    const Icon = toolbarItem?.icon;

                    return (
                      <span className="flex items-center gap-2">
                        {Icon ? <Icon aria-hidden className="size-4" /> : null}
                        {toolbarItem?.label ?? toolWindow.title}
                      </span>
                    );
                  }}
                >
                  <div className="flex min-h-0 flex-1">
                    <EditorDockToolbar items={toolbarItems} side="left" />
                    <DockResolvedLayout className="min-h-0 flex-1" />
                    <EditorDockToolbar items={toolbarItems} side="right" />
                  </div>
                </DockDragDropContext>
                <DocumentStatus documents={documents} />
              </EditorDockServicesProvider>
            </DockProvider>
          </TooltipProvider>
        </ShortcutProvider>
      </PlatformProvider>
    </div>
  );
};

const toolbarItems = [
  { id: editorDockToolWindowIds.outline, label: "Outline", placement: "left-top", icon: ListTree },
  { id: editorDockToolWindowIds.tracks, label: "Tracks", placement: "left-bottom", icon: Rows3 },
  {
    id: editorDockToolWindowIds.timeline,
    label: "Timeline",
    placement: "bottom-left",
    icon: ChartGantt,
  },
  {
    id: editorDockToolWindowIds.inspector,
    label: "Inspector",
    placement: "right-top",
    icon: Captions,
  },
  { id: editorDockToolWindowIds.quality, label: "QC", placement: "right-bottom", icon: Bug },
  {
    id: editorDockToolWindowIds.playback,
    label: "Playback",
    placement: "bottom-right",
    icon: Gauge,
  },
] as const;

function createEditorUiPlugin(
  dock: ReturnType<typeof createEditorDock>["store"],
  commandPaletteRef: React.RefObject<{ toggle(): void } | null>,
  contextRef: React.RefObject<EditorCommandContext | null>,
) {
  const menuRoots: MenuRootContribution[] = [
    { menu: "main.file", label: "File", order: 10 },
    { menu: "main.edit", label: "Edit", order: 20 },
    { menu: "main.cue", label: "Cue", order: 30 },
    { menu: "main.timing", label: "Timing", order: 40 },
    { menu: "main.playback", label: "Playback", order: 50 },
    { menu: "main.view", label: "View", order: 60 },
  ];
  const subtitleCommands = defaultSubtitleCommands.map((command) =>
    withFallbackHandler(command as CommandDefinition<unknown, unknown>, contextRef),
  );
  const commandById = new Map(subtitleCommands.map((command) => [command.id, command]));
  const menus: MenuContribution[] = remapMenuCommands(
    defaultSubtitleMenuContributions as MenuContribution[],
    commandById,
  );
  const shortcuts: ShortcutContribution[] = [
    ...remapShortcutCommands(
      defaultSubtitleShortcutContributions as ShortcutContribution[],
      commandById,
    ),
  ];

  const commands: CommandDefinition<unknown, unknown>[] = [...subtitleCommands];

  const notifyCommand = (
    id: string,
    title: string,
    menu: string,
    group: string,
    shortcut?: string,
  ) => {
    const command = createCommand({
      id,
      title,
      category: "Editor",
      keywords: [group],
      handler: () => contextRef.current?.notify(`${title} triggered.`),
    });
    commands.push(command);
    menus.push({ menu, command, group, order: 10 });
    if (shortcut) shortcuts.push({ command, shortcut, preventDefault: true, source: "editor" });
  };

  notifyCommand("editor.file.new", "New project", "main.file", "Project", "Mod+N");
  notifyCommand("editor.file.open", "Open", "main.file", "Project", "Mod+O");
  notifyCommand("editor.file.save", "Save", "main.file", "Project", "Mod+S");

  const commandPaletteCommand = createCommand({
    id: "editor.commandPalette.toggle",
    title: "Show command palette",
    category: "View",
    keywords: ["palette", "commands", "search"],
    handler: () => commandPaletteRef.current?.toggle(),
  });
  commands.push(commandPaletteCommand);
  menus.push({ menu: "main.view", command: commandPaletteCommand, group: "Window", order: 5 });
  shortcuts.push({
    command: commandPaletteCommand,
    shortcut: "Mod+Shift+P",
    preventDefault: true,
    source: "editor",
  });
  menus.push({
    kind: "submenu",
    menu: "main.view",
    submenu: "main.view.panels",
    label: "Panels",
    group: "Window",
    order: 10,
  });

  toolbarItems.forEach((item, index) => {
    const command = createCommand({
      id: `editor.view.toggle.${item.id}`,
      title: item.label,
      category: "View",
      handler: () => {
        const state = dock.getState();
        const visible = Object.values(state.placements).some((placement) =>
          placement.itemIds.includes(item.id),
        );
        if (visible) dock.hideToolWindow(item.id);
        else dock.showToolWindow(item.id);
      },
    });
    commands.push(command);
    menus.push({
      kind: "toggle",
      menu: "main.view.panels",
      command,
      group: "Panels",
      order: (index + 1) * 10,
      checked: () => {
        const state = dock.getState();
        return Object.values(state.placements).some((placement) =>
          placement.itemIds.includes(item.id),
        );
      },
    });
  });

  const contributions = { menuRoots, menus, shortcuts };

  return {
    contributions,
    plugin: createPlugin({
      id: "editor.legacy-dock-ui",
      commands,
      menuRoots,
      menus,
      shortcuts,
    }),
  };
}

function withFallbackHandler(
  command: CommandDefinition<unknown, unknown>,
  contextRef: React.RefObject<EditorCommandContext | null>,
): CommandDefinition<unknown, unknown> {
  return {
    ...command,
    handler:
      command.handler ??
      (() => {
        contextRef.current?.notify(`${getCommandTitle(command)} triggered.`);
      }),
  };
}

function remapMenuCommands(
  menus: MenuContribution[],
  commandById: ReadonlyMap<string, CommandDefinition<unknown, unknown>>,
): MenuContribution[] {
  return menus.map((menu) => {
    if (menu.kind === "submenu") return menu;
    return { ...menu, command: commandById.get(menu.command.id) ?? menu.command };
  });
}

function remapShortcutCommands(
  shortcuts: ShortcutContribution[],
  commandById: ReadonlyMap<string, CommandDefinition<unknown, unknown>>,
): ShortcutContribution[] {
  return shortcuts.map((shortcut) => ({
    ...shortcut,
    command: commandById.get(shortcut.command.id) ?? shortcut.command,
  }));
}

function getCommandTitle(command: CommandDefinition<unknown, unknown>) {
  const title = command.title;
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "defaultMessage" in title) {
    return String(title.defaultMessage);
  }
  return command.id;
}
