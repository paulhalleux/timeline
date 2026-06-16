import { useStore } from "@ptl/store/react";
import type { TimedTextDocumentService } from "@ptl/subtitle-core";

export function DocumentStatus({ documents }: { documents: TimedTextDocumentService }) {
  const document = useStore(documents.getDocumentStore());
  const cueCount = document?.tracks.reduce((total, track) => total + track.cues.length, 0) ?? 0;

  return (
    <div className="border-t px-3 py-1 text-xs text-muted-foreground">
      {cueCount} cue{cueCount === 1 ? "" : "s"} in {(document?.format ?? "vtt").toUpperCase()}
    </div>
  );
}
