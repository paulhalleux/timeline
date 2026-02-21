import { useStoreSelector } from "@ptl/store/react";
import { getMetadataValue } from "@ptl/subtitle";
import { useTimeline } from "@ptl/timeline-react";
import { PackageOpenIcon } from "lucide-react";

import { useSubtitleDocument } from "../../../core/react.tsx";
import { binarySearchMatchingTime } from "../../../utils/binary-search.ts";
import { formatTimeShort } from "../../../utils/format-time.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { EmptyState } from "../../ui/empty-state";
import { Playhead, Ruler, Timeline } from "../../ui/timeline";

export const EditorTimeline = () => {
  const timeline = useTimeline();
  const document = useSubtitleDocument((state) => state);

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

  if (!document) {
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

  const tracks = [
    {
      id: "Subtitles",
      title: getMetadataValue(document, "name", "Unnamed Document"),
      format: document.format,
      items: document.cues
        .slice(visibleRange.indexIn, visibleRange.indexOut + 1)
        .map((cue) => ({
          id: cue.id,
          start: cue.start.ms,
          end: cue.end.ms,
          content: cue.content,
        })),
    },
  ];

  return (
    <Timeline.Root>
      <Timeline.Overlay>
        <Playhead />
      </Timeline.Overlay>
      <Timeline.Viewport>
        <Ruler.Root>
          <Ruler.Header>00:00:00</Ruler.Header>
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
          <Timeline.Track height={40} key={track.id}>
            <Timeline.TrackHeader className="flex items-center px-3 text-sm text-gray-400">
              <span className="bg-gray-700/50 text-gray-300 px-1 rounded mr-2 text-xs font-bold shrink-0">
                {track.format.toUpperCase()}
              </span>
              <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                {track.title}
              </span>
            </Timeline.TrackHeader>
            <Timeline.TrackContent>
              {track.items.map((item) => (
                <Timeline.TrackItem
                  key={item.id}
                  start={item.start}
                  end={item.end}
                  className="flex items-center justify-center px-1"
                >
                  <CueContentDisplay
                    content={item.content}
                    className="text-xs text-ellipsis overflow-hidden whitespace-nowrap inline-block"
                  />
                </Timeline.TrackItem>
              ))}
            </Timeline.TrackContent>
          </Timeline.Track>
        ))}
      </Timeline.Viewport>
    </Timeline.Root>
  );
};
