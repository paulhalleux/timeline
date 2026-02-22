import { getMetadataValue } from "@ptl/subtitle";

import { PackageOpenIcon } from "lucide-react";

import { useDocumentList } from "../../../core/react.tsx";
import { formatTimeShort } from "../../../utils/format-time.ts";
import { EmptyState } from "../../ui/empty-state";
import { Playhead, Ruler, Timeline } from "../../ui/timeline";
import { DocumentTrack } from "./document-track.tsx";
import { TimelineToolbar } from "./timeline-toolbar.tsx";

export const EditorTimeline = () => {
  const documentList = useDocumentList();

  if (!documentList.length) {
    return (
      <EmptyState.Root>
        <EmptyState.Icon icon={PackageOpenIcon} />
        <EmptyState.Title>No document loaded</EmptyState.Title>
        <EmptyState.Description>
          Please load a subtitle document to see the timeline.
        </EmptyState.Description>
      </EmptyState.Root>
    );
  }

  const tracks = documentList.map((document) => {
    return {
      id: getMetadataValue<string>(document, "id"),
      document: document,
    };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TimelineToolbar />
      <div className="flex-1 min-h-0">
        <Timeline.Root>
          <Timeline.Overlay>
            <Playhead />
          </Timeline.Overlay>
          <Timeline.Viewport>
            <Ruler.Root>
              <Ruler.Header className="flex items-center px-3" />
              <Ruler.Ticks>
                {({ unit, left, width }) => (
                  <Ruler.Tick
                    left={left}
                    width={width}
                    className="text-xs px-1 py-0.5 text-gray-400 font-mono"
                  >
                    {formatTimeShort(unit)}
                  </Ruler.Tick>
                )}
              </Ruler.Ticks>
            </Ruler.Root>
            {tracks.map((track) => (
              <DocumentTrack
                key={track.id}
                id={track.id}
                document={track.document}
              />
            ))}
          </Timeline.Viewport>
        </Timeline.Root>
      </div>
    </div>
  );
};
