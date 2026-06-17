import { createPlugin } from "@ptl/platform-core";
import { createExportFormat, exportFormats } from "./export-formats";

export const srtExportFormat = createExportFormat({
  id: "srt",
  label: "SubRip",
  extensions: ["srt"],
  export: async () => ({ content: "", mimeType: "application/x-subrip" }),
});

export const createSrtExportPlugin = () => createPlugin({
  id: "export.format.srt",
  requires: [exportFormats],
  contributions: [exportFormats.contribute(srtExportFormat)],
});
