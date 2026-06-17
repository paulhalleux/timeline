import { createExtensionPoint, type LocalizedText } from "@ptl/platform-core";

export interface ExportContext<TOptions = unknown> {
  readonly options: TOptions;
  readonly document: unknown;
}

export interface ExportResult {
  readonly content: string;
  readonly mimeType: string;
}

export interface ExportFormat<TOptions = unknown> {
  readonly id: string;
  readonly label: LocalizedText;
  readonly extensions: readonly string[];
  readonly mimeTypes?: readonly string[];
  createDefaultOptions?(): TOptions;
  export(context: ExportContext<TOptions>): Promise<ExportResult>;
}

export function createExportFormat<TOptions>(definition: ExportFormat<TOptions>): ExportFormat<TOptions> {
  return definition;
}

export const exportFormats = createExtensionPoint<ExportFormat>({
  id: "export.formats",
  key: (format) => format.id,
  duplicates: "error",
});
