import { ActionScope, type ActionContext, type ActionDefinition } from "@ptl/action-core";
import { Actions } from "@ptl/action-react";
import { TooltipProvider } from "@ptl/ui";
import React from "react";
import { AppMenubar } from "./menu-bar";
import { RegisterableHotkey } from "@tanstack/react-hotkeys";

interface EditorActionContext extends ActionContext {
  notify(message: string): void;
}

export const App = () => {
  const contextRef = React.useRef<EditorActionContext | null>(null);
  const editorActions = React.useMemo(() => createEditorActions(), []);

  const actionScope = React.useMemo(
    () =>
      new ActionScope<EditorActionContext>({
        id: "editor",
        actions: editorActions,
        getContext: () => {
          if (!contextRef.current) throw new Error("Editor action context is not ready.");
          return contextRef.current;
        },
      }),
    [editorActions],
  );

  contextRef.current = {
    notify: () => undefined,
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <Actions.Provider runner={actionScope}>
        <TooltipProvider>
          <Actions.Hotkeys />
          <AppMenubar runner={actionScope} />
        </TooltipProvider>
      </Actions.Provider>
    </div>
  );
};

function createEditorActions(): readonly ActionDefinition<EditorActionContext>[] {
  const notifyAction = (
    id: string,
    title: string,
    path: readonly string[],
    icon: string,
    keybinding?: RegisterableHotkey,
  ): ActionDefinition<EditorActionContext> => ({
    id,
    title,
    category: path[0] ?? "Editor",
    keybindings: keybinding ? [{ keys: keybinding, preventDefault: true }] : undefined,
    presentation: { icon, menu: { path, order: 10 } },
    run: (context, invocation) => {
      context.notify(`${title} triggered from ${invocation.source}.`);
    },
  });

  return [
    notifyAction("editor.file.new", "New project", ["File", "Project"], "file-plus", "Mod+N"),
    notifyAction("editor.file.open", "Open", ["File", "Project"], "folder-open", "Mod+O"),
    notifyAction("editor.file.save", "Save", ["File", "Project"], "save", "Mod+S"),
    notifyAction("editor.edit.undo", "Undo", ["Edit", "History"], "undo", "Mod+Z"),
    notifyAction("editor.edit.redo", "Redo", ["Edit", "History"], "redo", "Mod+Shift+Z"),
    notifyAction(
      "editor.timeline.snap",
      "Snap to captions",
      ["Timeline", "Timing"],
      "sparkles",
      "Mod+Shift+K",
    ),
  ];
}
