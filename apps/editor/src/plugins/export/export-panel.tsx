import { useContributions } from "@ptl/platform-react";
import { exportFormats } from "./export-formats";

export function ExportPanel() {
  const formats = useContributions(exportFormats);
  return (
    <div className="space-y-2 text-xs">
      <div className="font-medium">Export formats</div>
      {formats.map((format) => (
        <div key={format.id} className="rounded border px-2 py-1">
          {typeof format.label === "string" ? format.label : format.label.defaultMessage}
        </div>
      ))}
      {formats.length === 0 ? <div className="text-muted-foreground">No export formats installed.</div> : null}
    </div>
  );
}
