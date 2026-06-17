import { DockContributionLayout } from "@ptl/dock-react";
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
import React from "react";

import { createEditorApplication } from "../../application/create-editor-application";
import { EditorDockServicesProvider } from "../../dock/editor-services-context";
import { DocumentStatus } from "./document-status";
import { AppMenubar } from "./menu-bar";

export const App = () => {
  const application = React.useMemo(() => createEditorApplication(), []);
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
  const historyState = useStore(documents.getHistoryStore());
  const playbackState = useStore(playback.getStore());
  const selectionState = useStore(selection.getStore());
  const platformContext = React.useMemo<SubtitleCommandContext>(
    () => ({ history: historyState, playback: playbackState, selection: selectionState }),
    [historyState, playbackState, selectionState],
  );

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
    <PlatformProvider platform={application.platform}>
      <ShortcutProvider context={platformContext}>
        <TooltipProvider>
          <EditorDockServicesProvider services={{ documents, playback, selection }}>
            <div className="flex h-full flex-col bg-background text-foreground">
              <AppMenubar context={platformContext} />
              <main className="min-h-0 flex-1">
                <DockContributionLayout className="min-h-0 flex-1" preset={application.layout} />
              </main>
              <DocumentStatus documents={documents} />
              <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
            </div>
          </EditorDockServicesProvider>
        </TooltipProvider>
      </ShortcutProvider>
    </PlatformProvider>
  );
};
