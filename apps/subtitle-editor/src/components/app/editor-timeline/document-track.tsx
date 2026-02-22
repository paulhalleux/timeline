import { useStoreSelector } from "@ptl/store/react";
import { getMetadataValue, type SubtitleDocument } from "@ptl/subtitle";
import { useTimeline } from "@ptl/timeline-react";

import clsx from "clsx";

import { useSelectedCueIds, useSubtitleEditor } from "../../../core/react.tsx";
import { binarySearchMatchingTime } from "../../../utils/binary-search.ts";
import { CueContentDisplay } from "../../ui/cue-content-display";
import { Timeline } from "../../ui/timeline";

type DocumentTrackProps = {
  id: string | undefined;
  document: SubtitleDocument;
};

export const DocumentTrack = ({ id, document }: DocumentTrackProps) => {
  const timeline = useTimeline();
  const editor = useSubtitleEditor();
  const selected = useSelectedCueIds();

  const isActive = useStoreSelector(
    editor.store,
    (state) => state.activeDocumentId === id,
  );

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
    <Timeline.Track
      height={40}
      className={isActive ? "bg-neutral-950" : undefined}
      onClick={(e) => {
        if (e.ctrlKey && isActive) {
          editor.setActiveDocument(undefined);
        } else {
          editor.setActiveDocument(id);
        }
      }}
    >
      <Timeline.TrackHeader
        className={clsx("flex items-center px-3 text-sm text-neutral-400", {
          "bg-neutral-950!": isActive,
        })}
      >
        <span className="bg-neutral-700/50 text-neutral-300 px-1 rounded mr-2 text-xs font-bold shrink-0">
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
              className="flex items-center justify-center px-1 cursor-pointer"
              isSelected={selected.has(cue.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (!e.ctrlKey) {
                  editor.clearSelectedCues();
                }

                if (selected.has(cue.id) && e.ctrlKey) {
                  editor.deselectCue(cue.id);
                } else {
                  editor.selectCue(cue.id);
                }
              }}
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
