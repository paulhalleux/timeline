import { createServiceToken } from "@ptl/platform-core";
import type { TimedTextFormatContribution } from "@ptl/timed-text-core";
import { supportsExport } from "./export-formats";

export interface ExportService {
  listFormats(): readonly TimedTextFormatContribution[];
}

export const exportService = createServiceToken<ExportService>("export.service");

export function createExportService(options: {
  readonly getFormats: () => readonly TimedTextFormatContribution[];
}): ExportService {
  return { listFormats: () => options.getFormats().filter(supportsExport) };
}
