import { getMetadataValue } from "@ptl/subtitle";
import { CornerDownLeftIcon, CornerDownRightIcon } from "lucide-react";
import React from "react";

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
      title: getMetadataValue(document, "name", "Unnamed Document"),
      format: document.format,
      items: document.cues.map((cue) => ({
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
                {formatTime(unit)}
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
                  <div className="text-xs text-ellipsis overflow-hidden whitespace-nowrap inline-block">
                    {item.content.map((c, index) => {
                      if (c.type === "text" || c.type === "styled") {
                        return c.text;
                      } else {
                        return (
                          <>
                            <CornerDownLeftIcon
                              key={item.id + index + "start"}
                              className="inline text-white/50 mx-0.5"
                              size={12}
                            />
                            <br />
                            <CornerDownRightIcon
                              key={item.id + index + "end"}
                              className="inline text-white/50 mx-0.5"
                              size={12}
                            />
                          </>
                        );
                      }
                    })}
                  </div>
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
