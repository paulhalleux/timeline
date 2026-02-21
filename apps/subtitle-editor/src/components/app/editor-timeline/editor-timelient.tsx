import { contentToPlainText } from "@ptl/subtitle";

import { useSubtitleDocument } from "../../../core/react.tsx";
import { Playhead, Ruler, Timeline } from "../../ui/timeline";

export const EditorTimeline = () => {
  const document = useSubtitleDocument((state) => state);

  if (!document) {
    return (
      <div className="p-4 text-gray-400">No subtitle document loaded.</div>
    );
  }

  const tracks = [
    {
      id: "Subtitles",
      items: document.cues.map((cue) => ({
        id: cue.id,
        start: cue.start.ms,
        end: cue.end.ms,
        content: contentToPlainText(cue.content),
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
                {formatTime(unit)}
              </Ruler.Tick>
            )}
          </Ruler.Ticks>
        </Ruler.Root>
        {tracks.map((track) => (
          <Timeline.Track height={40} key={track.id}>
            <Timeline.TrackHeader className="flex items-center px-3 text-sm text-gray-400">
              {track.id}
            </Timeline.TrackHeader>
            <Timeline.TrackContent>
              {track.items.map((item) => (
                <Timeline.TrackItem
                  key={item.id}
                  start={item.start}
                  end={item.end}
                  className="flex items-center justify-center px-0.5"
                >
                  <span className="text-xs text-ellipsis overflow-hidden whitespace-nowrap">
                    {item.content}
                  </span>
                </Timeline.TrackItem>
              ))}
            </Timeline.TrackContent>
          </Timeline.Track>
        ))}
      </Timeline.Viewport>
    </Timeline.Root>
  );
};

const formatTime = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
