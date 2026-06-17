import type { TimedTextFormatContribution } from "@ptl/timed-text-core";

export type ExportFormat = TimedTextFormatContribution;

export function supportsExport(format: TimedTextFormatContribution): boolean {
  return format.capabilities.some((capability) => capability.operation === "export");
}
