import type {
  DefaultSubtitleSelectionService,
  SubtitlePlaybackService,
  TimedTextDocumentService,
} from "@ptl/subtitle-core";
import React from "react";

export interface EditorDockServices {
  documents: TimedTextDocumentService;
  playback: SubtitlePlaybackService;
  selection: DefaultSubtitleSelectionService;
}

const EditorDockServicesContext = React.createContext<EditorDockServices | null>(null);

/**
 * Provides editor-owned services to dock pane components.
 *
 * @example
 * ```tsx
 * <EditorDockServicesProvider services={services}>
 *   <DockResolvedLayout />
 * </EditorDockServicesProvider>
 * ```
 */
export function EditorDockServicesProvider({
  children,
  services,
}: {
  children: React.ReactNode;
  services: EditorDockServices;
}) {
  return (
    <EditorDockServicesContext.Provider value={services}>
      {children}
    </EditorDockServicesContext.Provider>
  );
}

export function useEditorDockServices(): EditorDockServices {
  const services = React.useContext(EditorDockServicesContext);

  if (!services) {
    throw new Error("Editor dock services are not available.");
  }

  return services;
}
