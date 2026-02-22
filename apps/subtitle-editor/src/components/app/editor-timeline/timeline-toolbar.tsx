import { useStoreSelector } from "@ptl/store/react";
import {
  getDocumentDuration,
  getDocumentStartTime,
  plainTextToContent,
  time,
} from "@ptl/subtitle";
import { PlayheadModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";

import {
  ChevronFirstIcon,
  ChevronLastIcon,
  EraserIcon,
  Layers2Icon,
  Maximize2Icon,
  MergeIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReplaceIcon,
  SplitIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { useAddNewCue } from "../../../core/actions/cue.ts";
import { useSubtitleDocument } from "../../../core/react.tsx";
import { formatTime } from "../../../utils/format-time.ts";
import { ToggleGroup } from "../../ui/toggle-group";
import { Toolbar } from "../../ui/toolbar";

export const TimelineToolbar = () => {
  const timeline = useTimeline();
  const activeDocument = useSubtitleDocument((e) => e);
  const addNewCue = useAddNewCue();

  const playheadApi = PlayheadModule.for(timeline);

  const { position, isPlaying } = useStoreSelector(
    playheadApi.getStore(),
    (state) => state,
  );

  const visibleRange = useStoreSelector(timeline.getStore(), () =>
    timeline.getVisibleRange(),
  );

  const maxVisibleRange = timeline.getOptions().maxVisibleRange;
  const minVisibleRange = timeline.getOptions().minVisibleRange;

  const zoomPct = Math.round(timeline.getZoomLevel() * 100);

  const handlePlayPause = () => {
    if (isPlaying) {
      playheadApi.pause();
    } else {
      playheadApi.play(1);
    }
  };

  const handleSkipToStart = () => {
    if (activeDocument === null) return;

    const startTime = getDocumentStartTime(activeDocument);

    playheadApi.pause();
    playheadApi.setPosition(startTime);

    const range = timeline.getVisibleRange();
    const newStart = Math.max(0, startTime - range / 2);
    timeline.setVisibleRange(range);
    timeline.setCurrentPosition(newStart);
  };

  const handleSkipToEnd = () => {
    if (activeDocument === null) return;

    const duration = getDocumentDuration(activeDocument);

    playheadApi.pause();
    playheadApi.setPosition(duration);

    const range = timeline.getVisibleRange();
    const newStart = Math.max(0, duration - range / 2);
    timeline.setVisibleRange(range);
    timeline.setCurrentPosition(newStart);
  };

  const handleZoomIn = () => {
    timeline.setZoom(timeline.getZoomLevel() + 0.1 * timeline.getZoomLevel());
  };

  const handleZoomOut = () => {
    timeline.setZoom(timeline.getZoomLevel() - 0.1 * timeline.getZoomLevel());
  };

  const handleZoomFit = () => {
    if (activeDocument === null) return;

    const startTime = getDocumentStartTime(activeDocument);
    const documentDuration = getDocumentDuration(activeDocument);

    // Set visible range to fit the entire document, with some padding on either side
    const padding = documentDuration * 0.1; // 10% of duration as padding
    const newVisibleRange = documentDuration + padding * 2;

    timeline.setVisibleRange(newVisibleRange);
    timeline.setCurrentPosition(startTime - padding);
  };

  const handleAddCue = () => {
    if (activeDocument === null) return;

    addNewCue({
      start: time(position),
      end: time(position + 2000), // Default to 2 seconds duration
      content: plainTextToContent("New subtitle"),
    });
  };

  const canZoomIn = visibleRange > minVisibleRange;
  const canZoomOut = visibleRange < maxVisibleRange;

  return (
    <Toolbar.Root>
      {/* Playback controls */}
      <Toolbar.Section>
        <Toolbar.IconButton
          icon={ChevronFirstIcon}
          tooltip="Skip to start"
          disabled={activeDocument === null}
          onClick={handleSkipToStart}
        />
        <Toolbar.IconButton
          icon={isPlaying ? PauseIcon : PlayIcon}
          tooltip={isPlaying ? "Pause" : "Play"}
          active={isPlaying}
          onClick={handlePlayPause}
        />
        <Toolbar.IconButton
          icon={ChevronLastIcon}
          tooltip="Skip to end"
          disabled={activeDocument === null}
          onClick={handleSkipToEnd}
        />
      </Toolbar.Section>

      <Toolbar.Separator />

      {/* Time display */}
      <Toolbar.Section>
        <Toolbar.Label className="tabular-nums w-24 text-center">
          {formatTime(position)}
        </Toolbar.Label>
      </Toolbar.Section>

      <Toolbar.Separator />

      {/* Zoom controls */}
      <Toolbar.Section>
        <Toolbar.IconButton
          icon={ZoomOutIcon}
          tooltip="Zoom out"
          disabled={!canZoomOut}
          onClick={handleZoomOut}
        />
        <Toolbar.Label className="tabular-nums w-10 text-center">
          {zoomPct}%
        </Toolbar.Label>
        <Toolbar.IconButton
          icon={ZoomInIcon}
          tooltip="Zoom in"
          disabled={!canZoomIn}
          onClick={handleZoomIn}
        />
        <Toolbar.IconButton
          icon={Maximize2Icon}
          tooltip="Fit to view"
          disabled={!canZoomOut}
          onClick={handleZoomFit}
        />
      </Toolbar.Section>

      {/* Editing controls (e.g. add subtitle, split, etc.) could go here */}
      <Toolbar.Separator />

      <Toolbar.Section>
        <Toolbar.IconButton
          icon={PlusIcon}
          tooltip="Add subtitle"
          disabled={activeDocument === null}
          onClick={handleAddCue}
        />
        <Toolbar.IconButton
          icon={SplitIcon}
          tooltip="Split subtitle"
          disabled={activeDocument === null}
          onClick={() => {
            // Handle splitting the subtitle at the current playhead position
          }}
        />
        <Toolbar.IconButton
          icon={MergeIcon}
          tooltip="Merge subtitles"
          disabled={activeDocument === null}
          onClick={() => {
            // Handle merging the current subtitle with the next one
          }}
        />
        <Toolbar.IconButton
          icon={TrashIcon}
          tooltip="Delete subtitle"
          disabled={activeDocument === null}
          onClick={() => {
            // Handle deleting the subtitle at the current playhead position
          }}
        />
      </Toolbar.Section>

      <Toolbar.Separator />

      <Toolbar.Section>
        <ToggleGroup.Root
          value="override"
          onValueChange={() => {}}
          className="bg-transparent"
        >
          <ToggleGroup.Item value="override" aria-label="Override">
            <EraserIcon size={14} />
          </ToggleGroup.Item>
          <ToggleGroup.Item value="replace" aria-label="Replace">
            <ReplaceIcon size={14} />
          </ToggleGroup.Item>
          <ToggleGroup.Item value="overlap" aria-label="Allow overlap">
            <Layers2Icon size={14} />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </Toolbar.Section>
    </Toolbar.Root>
  );
};
