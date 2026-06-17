import { CommandPalette, PlatformProvider } from "@ptl/platform-react";
import { TooltipProvider } from "@ptl/ui";
import React from "react";

import { createEditorApplication } from "../../application/create-editor-application";
import { ExportPanel } from "../../plugins/export/export-panel";

export const App = () => {
  const application = React.useMemo(() => createEditorApplication(), []);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

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
      <TooltipProvider>
        <div className="flex h-full flex-col bg-background text-foreground">
          <header className="flex items-center justify-between border-b px-4 py-2">
            <div>
              <div className="font-medium">Timeline Editor</div>
              <div className="text-xs text-muted-foreground">Plugin-composed workspace</div>
            </div>
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() => setCommandPaletteOpen(true)}
              type="button"
            >
              Commands
            </button>
          </header>
          <main className="grid min-h-0 flex-1 grid-cols-[1fr_18rem] gap-3 p-3">
            <section className="rounded border p-3">
              <h1 className="text-sm font-medium">Subtitle document</h1>
              <p className="mt-2 text-xs text-muted-foreground">
                The editor shell is now bootstrapped from platform plugins and a declarative layout preset.
              </p>
            </section>
            <aside className="rounded border p-3">
              <ExportPanel />
            </aside>
          </main>
          <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
        </div>
      </TooltipProvider>
    </PlatformProvider>
  );
};
