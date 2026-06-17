import { DockContributionLayout } from "@ptl/dock-react";
import { CommandPalette, PlatformProvider, ShortcutProvider } from "@ptl/platform-react";
import { TooltipProvider } from "@ptl/ui";
import React from "react";

import { createEditorApplication } from "../../application/create-editor-application";
import { AppMenubar } from "./menu-bar";

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
      <ShortcutProvider context={{}}>
        <TooltipProvider>
          <div className="flex h-full flex-col bg-background text-foreground">
            <AppMenubar context={{}} />
            <header className="flex items-center justify-between border-b px-4 py-2">
              <div>
                <div className="font-medium">Timeline Editor</div>
                <div className="text-xs text-muted-foreground">Plugin-composed dock workspace</div>
              </div>
              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setCommandPaletteOpen(true)}
                type="button"
              >
                Commands
              </button>
            </header>
            <main className="min-h-0 flex-1 p-3">
              <DockContributionLayout className="rounded border" preset={application.layout} />
            </main>
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
          </div>
        </TooltipProvider>
      </ShortcutProvider>
    </PlatformProvider>
  );
};
