import { createCommand, provideService } from "@ptl/platform-core";
import { createDockPlugin, createTool } from "@ptl/dock-react";
import { ExportPanel } from "./export-panel";
import { createExportService, exportService } from "./export-service";
import { timedTextFormatContributions } from "@ptl/timed-text-core";

export const runExportCommand = createCommand({
  id: "export.run",
  title: "Export",
  handler: ({ get }) => get(exportService).listFormats()[0]?.adapter.format,
});

export const createExportPlugin = () =>
  createDockPlugin({
    id: "export",

    services: [
      provideService(exportService, ({ contributions }) =>
        createExportService({
          getFormats: () => contributions.getAll(timedTextFormatContributions),
        }),
      ),
    ] as never,
    commands: [runExportCommand] as never,
    tools: [
      createTool({
        id: "export",
        title: "Export",
        panel: ExportPanel,
        preferredPlacement: "right-bottom",
      }),
    ],
  });
