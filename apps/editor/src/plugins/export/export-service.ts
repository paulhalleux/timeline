import { createServiceToken } from "@ptl/platform-core";
import type { ExportFormat } from "./export-formats";

export interface ExportService {
  listFormats(): readonly ExportFormat[];
}

export const exportService = createServiceToken<ExportService>("export.service");

export function createExportService(options: { readonly getFormats: () => readonly ExportFormat[] }): ExportService {
  return { listFormats: options.getFormats };
}
