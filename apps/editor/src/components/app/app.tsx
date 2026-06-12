import { useEditorActions } from "../../actions/use-editor-actions";
import { AppMenubar } from "./menu-bar";

export const App = () => {
  const actionRuntime = useEditorActions();

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <AppMenubar runtime={actionRuntime} />
      <main
        className={`grid min-h-0 flex-1 ${actionRuntime.inspectorOpen ? "grid-cols-[1fr_260px]" : "grid-cols-1"}`}
      >
        <section className="min-w-0 border-r bg-muted/20 p-4">
          <div className="h-full rounded-lg border border-dashed bg-background/60 p-4">
            <div className="text-sm font-medium">Editor Surface</div>
          </div>
        </section>
        {actionRuntime.inspectorOpen && (
          <aside className="min-w-0 bg-background p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Inspector</div>
            <div className="mt-3 space-y-2 text-xs">
              {actionRuntime.activity.length === 0 ? (
                <div className="text-muted-foreground">No action triggered yet.</div>
              ) : (
                actionRuntime.activity.map((entry) => (
                  <div key={entry.id} className="rounded-md border bg-muted/30 px-2 py-1.5">
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};
