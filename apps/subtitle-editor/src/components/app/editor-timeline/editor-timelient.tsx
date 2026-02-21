import { useStoreSelector } from "@ptl/store/react";
import { getMetadataValue, type SubtitleDocument } from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import { PackageOpenIcon } from "lucide-react";

import { useDocumentList, useSubtitleEditor } from "../../../core/react.tsx";
import { binarySearchMatchingTime } from "../../../utils/binary-search.ts";
import { formatTime, formatTimeShort } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { EmptyState } from "../../ui/empty-state";
import { Playhead, Ruler, Timeline } from "../../ui/timeline";

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
    <Timeline.Root>
      <Timeline.Overlay>
        <Playhead />
      </Timeline.Overlay>
      <Timeline.Viewport>
        <Ruler.Root>
          <Ruler.Header className="flex items-center px-3">
            <CurrentTime />
          </Ruler.Header>
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
  );
};

const DocumentTrack = ({
  id,
  document,
}: {
  id: string | undefined;
  document: SubtitleDocument;
}) => {
  const timeline = useTimeline();
  const editor = useSubtitleEditor();

  const visibleRange = useStoreSelector(timeline.getStore(), (state) => {
    if (!document) {
      return {
        indexIn: 0,
        indexOut: 0,
      };
    }

    const timeIn = state.current;
    const timeOut = timeIn + timeline.getVisibleRange();

    const indexIn = binarySearchMatchingTime(
      document.cues,
      timeIn,
      (cue) => cue.end.ms,
    );
    const indexOut = binarySearchMatchingTime(
      document.cues,
      timeOut,
      (cue) => cue.start.ms,
    );

    return {
      indexIn,
      indexOut,
    };
  });

  return (
    <Timeline.Track height={40} onClick={() => editor.setActiveDocument(id)}>
      <Timeline.TrackHeader className="flex items-center px-3 text-sm text-gray-400">
        <span className="bg-gray-700/50 text-gray-300 px-1 rounded mr-2 text-xs font-bold shrink-0">
          {document.format.toUpperCase()}
        </span>
        <span className="text-ellipsis overflow-hidden whitespace-nowrap">
          {getMetadataValue(document, "name", "Unnamed Document")}
        </span>
      </Timeline.TrackHeader>
      <Timeline.TrackContent>
        {document.cues
          .slice(visibleRange.indexIn, visibleRange.indexOut + 1)
          .map((cue) => (
            <Timeline.TrackItem
              key={cue.id}
              start={cue.start.ms}
              end={cue.end.ms}
              className="flex items-center justify-center px-1"
            >
              <CueContentDisplay
                content={cue.content}
                className="text-xs text-ellipsis overflow-hidden whitespace-nowrap inline-block"
              />
            </Timeline.TrackItem>
          ))}
      </Timeline.TrackContent>
    </Timeline.Track>
  );
};

const CurrentTime = () => {
  const timeline = useTimeline();
  const playheadApi = PlayheadModule.for(timeline);
  const currentTime = useStoreSelector(
    playheadApi.getStore(),
    (state) => state.position,
  );

  return (
    <div className="bg-gray-700/50 text-gray-300 px-1 rounded text-xs font-mono">
      {formatTime(currentTime)}
    </div>
  );
};
