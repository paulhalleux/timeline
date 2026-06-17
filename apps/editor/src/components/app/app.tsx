import { CommandPalette, PlatformProvider, ShortcutProvider } from "@ptl/platform-react";
import { useStore } from "@ptl/store/react";
import {
  DefaultSubtitleSelectionService,
  SubtitlePlaybackService,
  TimedTextDocumentService,
  type SubtitleCommandContext,
} from "@ptl/subtitle-core";
import { createEditorDocument } from "@ptl/timed-text-core";
import { TooltipProvider } from "@ptl/ui";
import {
  DockDragDropContext,
  DockProvider,
  DockResolvedLayout,
} from "@ptl/dock-react";
import { Bug, Captions, ChartGantt, Gauge, ListTree, Rows3 } from "lucide-react";
import React from "react";

import { createEditorPlatform } from "../../platform/editor-platform";
import {
  createEditorDock,
  editorDockToolWindowIds,
} from "../../dock/editor-dock";
import { EditorDockServicesProvider } from "../../dock/editor-services-context";
import { EditorDockToolbar } from "../../dock/dock-toolbar";
import { DocumentStatus } from "./document-status";
import { AppMenubar } from "./menu-bar";

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
  const commandSetup = React.useMemo(
    () =>
      createEditorPlatform({
        documents,
        playback,
        selection,
        dock: dock.store,
        contextRef,
        commandPaletteRef,
      }),
    [documents, playback, selection, dock.store],
  );
  const historyState = useStore(documents.getHistoryStore());
  const playbackState = useStore(playback.getStore());
  const selectionState = useStore(selection.getStore());
  const platformContext = React.useMemo<SubtitleCommandContext>(
    () => ({ history: historyState, playback: playbackState, selection: selectionState }),
    [historyState, playbackState, selectionState],
  );

  contextRef.current = {
    notify: (message) => {
      alert("Command executed!" + "\n\n" + message);
    },
  };

  commandPaletteRef.current = {
    toggle: () => setCommandPaletteOpen((prev) => !prev),
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <PlatformProvider platform={commandSetup.platform} components={dock.components}>
        <ShortcutProvider context={platformContext}>
          <TooltipProvider>
            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />
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
  {
    id: editorDockToolWindowIds.outline,
    label: "Outline",
    placement: "left-top",
    icon: ListTree,
  },
  {
    id: editorDockToolWindowIds.tracks,
    label: "Tracks",
    placement: "left-bottom",
    icon: Rows3,
  },
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
  {
    id: editorDockToolWindowIds.quality,
    label: "QC",
    placement: "right-bottom",
    icon: Bug,
  },
  {
    id: editorDockToolWindowIds.playback,
    label: "Playback",
    placement: "bottom-right",
    icon: Gauge,
  },
] as const;
