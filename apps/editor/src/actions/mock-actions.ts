import type { ActionDefinition } from "@ptl/actions";
import type { EditorActionServices } from "./services";

export type EditorActionDefinition = ActionDefinition<EditorActionServices>;

export const mockEditorActions: EditorActionDefinition[] = [
  {
    descriptor: {
      id: "editor.file.new",
      title: "New Document",
      category: "File",
      shortcuts: ["Mod+N"],
      placement: [
        { menu: "file", group: "document", order: 10, palette: true },
        { toolbar: "primary", group: "document", order: 10 },
      ],
    },
    run: ({ services }) => services.addActivity("Mock action: New Document"),
  },
  {
    descriptor: {
      id: "editor.file.open",
      title: "Open...",
      category: "File",
      shortcuts: ["Mod+O"],
      placement: [
        { menu: "file", group: "document", order: 20, palette: true },
        { toolbar: "primary", group: "document", order: 20 },
      ],
    },
    run: ({ services }) => services.addActivity("Mock action: Open"),
  },
  {
    descriptor: {
      id: "editor.file.save",
      title: "Save",
      category: "File",
      shortcuts: ["Mod+S"],
      placement: [{ menu: "file", group: "document", order: 30, palette: true }],
    },
    getState: () => ({ visible: true, enabled: false, reason: "No document is loaded." }),
    run: ({ services }) => services.addActivity("Mock action: Save"),
  },
  {
    descriptor: {
      id: "editor.edit.undo",
      title: "Undo",
      category: "Edit",
      shortcuts: ["Mod+Z"],
      placement: [{ menu: "edit", group: "history", order: 10, palette: true }],
    },
    getState: () => ({ visible: true, enabled: false, reason: "Nothing to undo." }),
    run: ({ services }) => services.addActivity("Mock action: Undo"),
  },
  {
    descriptor: {
      id: "editor.edit.redo",
      title: "Redo",
      category: "Edit",
      shortcuts: ["Shift+Mod+Z"],
      placement: [{ menu: "edit", group: "history", order: 20, palette: true }],
    },
    getState: () => ({ visible: true, enabled: false, reason: "Nothing to redo." }),
    run: ({ services }) => services.addActivity("Mock action: Redo"),
  },
  {
    descriptor: {
      id: "editor.view.toggle-inspector",
      title: "Inspector",
      category: "View",
      shortcuts: ["Mod+I"],
      placement: [
        { menu: "view", group: "panels", order: 10, palette: true },
        { toolbar: "primary", group: "panels", order: 30 },
      ],
    },
    getState: ({ services }) => ({
      visible: true,
      enabled: true,
      checked: services.getInspectorOpen(),
    }),
    run: ({ services }) => {
      const nextOpen = !services.getInspectorOpen();

      services.setInspectorOpen(nextOpen);
      services.addActivity(`Mock action: ${nextOpen ? "Show" : "Hide"} Inspector`);
    },
  },
  {
    descriptor: {
      id: "editor.actions.command-palette",
      title: "Command Palette...",
      category: "Tools",
      shortcuts: ["Mod+Shift+P"],
      placement: [{ menu: "tools", group: "actions", order: 10, palette: false }],
    },
    run: ({ services }) => services.setCommandPaletteOpen(true),
  },
];
