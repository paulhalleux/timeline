import { createCommand, provideService } from "@ptl/platform-core";
import { createDockPlugin, createTool } from "@ptl/dock-react";
import { ExportPanel } from "./export-panel";
import { createExportService, exportService } from "./export-service";
import { exportFormats } from "./export-formats";

export const runExportCommand = createCommand({
  id: "export.run",
  title: "Export",
  handler: ({ get }) => get(exportService).listFormats()[0]?.id,
});

export const createExportPlugin = () => createDockPlugin({
  id: "export",
  extensionPoints: [exportFormats],
  services: [provideService(exportService, ({ contributions }) => createExportService({ getFormats: () => contributions.getAll(exportFormats) }))],
  commands: [runExportCommand],
  tools: [createTool({ id: "export", title: "Export", panel: ExportPanel, preferredPlacement: "right-bottom" })],
});
