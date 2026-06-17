import { createCommand, createMenuRoot } from "@ptl/platform-core";
import { Bug, Captions, ChartGantt, Gauge, ListTree, Rows3 } from "lucide-react";
import { createDockPlugin, createTool, createWorkspaceEditor } from "@ptl/dock-react";

import {
  InspectorToolWindow,
  OutlineToolWindow,
  PlaybackToolWindow,
  QualityToolWindow,
  SubtitleDocumentPane,
  TimelineToolWindow,
  TracksToolWindow,
} from "../dock/dock-components";

export const subtitleWorkspaceEditor = createWorkspaceEditor({
  id: "subtitle-document",
  panel: SubtitleDocumentPane,
  getTitle: () => "Subtitles",
  allowMultiple: false,
});

export const newProjectCommand = createCommand({
  id: "editor.file.new",
  title: "New project",
  category: "File",
  handler: () => undefined,
});

export const openProjectCommand = createCommand({
  id: "editor.file.open",
  title: "Open",
  category: "File",
  handler: () => undefined,
});

export const saveProjectCommand = createCommand({
  id: "editor.file.save",
  title: "Save",
  category: "File",
  handler: () => undefined,
});

export const editorMenuRoots = [
  createMenuRoot({ menu: "main.file", label: "File", order: 10 }),
  createMenuRoot({ menu: "main.view", label: "View", order: 20 }),
] as const;

export const createDockHostPlugin = () => createDockPlugin({ id: "dock" });
export const createShellPlugin = () =>
  createDockPlugin({
    id: "editor.shell",
    workspaceEditors: [subtitleWorkspaceEditor],
    commands: [newProjectCommand, openProjectCommand, saveProjectCommand] as never,
    menuRoots: editorMenuRoots as never,
    menus: [
      { menu: "main.file", command: newProjectCommand, group: "Project", order: 10 },
      { menu: "main.file", command: openProjectCommand, group: "Project", order: 20 },
      { menu: "main.file", command: saveProjectCommand, group: "Project", order: 30 },
    ] as never,
    shortcuts: [
      { command: newProjectCommand, shortcut: "Mod+N", preventDefault: true, source: "editor" },
      { command: openProjectCommand, shortcut: "Mod+O", preventDefault: true, source: "editor" },
      { command: saveProjectCommand, shortcut: "Mod+S", preventDefault: true, source: "editor" },
    ] as never,
  });
export const createSubtitleDocumentPlugin = () =>
  createDockPlugin({ id: "editor.subtitle-document" });
export const createOutlinePlugin = () =>
  createDockPlugin({
    id: "editor.outline",
    tools: [
      createTool({
        id: "outline",
        title: "Outline",
        icon: ListTree,
        panel: OutlineToolWindow,
        preferredPlacement: "left-top",
      }),
    ],
  });
export const createTracksPlugin = () =>
  createDockPlugin({
    id: "editor.tracks",
    tools: [
      createTool({
        id: "tracks",
        title: "Tracks",
        icon: Rows3,
        panel: TracksToolWindow,
        preferredPlacement: "left-bottom",
      }),
    ],
  });
export const createInspectorPlugin = () =>
  createDockPlugin({
    id: "editor.inspector",
    tools: [
      createTool({
        id: "inspector",
        title: "Inspector",
        icon: Captions,
        panel: InspectorToolWindow,
        preferredPlacement: "right-top",
      }),
    ],
  });
export const createQualityControlPlugin = () =>
  createDockPlugin({
    id: "editor.quality-control",
    tools: [
      createTool({
        id: "quality-control",
        title: "QC",
        icon: Bug,
        panel: QualityToolWindow,
        preferredPlacement: "right-bottom",
      }),
    ],
  });
export const createPlaybackPlugin = () =>
  createDockPlugin({
    id: "editor.playback",
    tools: [
      createTool({
        id: "playback",
        title: "Playback",
        icon: Gauge,
        panel: PlaybackToolWindow,
        preferredPlacement: "bottom-right",
      }),
    ],
  });
export const createTimelinePlugin = () =>
  createDockPlugin({
    id: "editor.timeline",
    tools: [
      createTool({
        id: "timeline",
        title: "Timeline",
        icon: ChartGantt,
        panel: TimelineToolWindow,
        preferredPlacement: "bottom-left",
        constraints: { canHide: true, canMove: true, minHeight: 160 },
      }),
    ],
  });
