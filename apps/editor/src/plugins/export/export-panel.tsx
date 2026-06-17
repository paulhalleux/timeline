import { useContributions } from "@ptl/platform-react";
import { timedTextFormatContributions } from "@ptl/timed-text-core";
import { supportsExport } from "./export-formats";

export function ExportPanel() {
  const formats = useContributions(timedTextFormatContributions).filter(supportsExport);
  return (
    <div className="space-y-2 text-xs">
      <div className="font-medium">Export formats</div>
      {formats.map((format) => (
        <div key={format.adapter.format} className="rounded border px-2 py-1">
          {format.adapter.label}
        </div>
      ))}
      {formats.length === 0 ? (
        <div className="text-muted-foreground">No export formats installed.</div>
      ) : null}
    </div>
  );
}
