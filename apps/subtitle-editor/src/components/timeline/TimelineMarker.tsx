import { MarkerModule, PlaybackModule } from "@ptl/subtitle-editor-core";
import { ViewportItem } from "@ptl/timeline-react";
import * as React from "react";

import {
  type TimelineMarker,
  useEditor,
  useIsMarkerSelected,
} from "../../core";
import styles from "./TimelineComponents.module.css";

interface TimelineMarkerItemProps {
  marker: TimelineMarker;
}

export const TimelineMarkerItem: React.FC<TimelineMarkerItemProps> = ({
  marker,
}) => {
  const editor = useEditor();
  const markersModule = MarkerModule.for(editor);
  const playbackModule = PlaybackModule.for(editor);
  const isSelected = useIsMarkerSelected(marker.id);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) {
        markersModule.toggleSelection(marker.id);
      } else {
        markersModule.select(marker.id);
      }
      // Seek to marker time
      playbackModule.seek(marker.time);
    },
    [markersModule, playbackModule, marker.id, marker.time],
  );

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Seek to marker and select it
      playbackModule.seek(marker.time);
      markersModule.select(marker.id);
    },
    [markersModule, playbackModule, marker.id, marker.time],
  );

  return (
    <ViewportItem start={marker.time} end={marker.time}>
      <div
        className={`${styles.marker} ${isSelected ? styles.markerSelected : ""}`}
        data-type={marker.type}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={marker.label ?? marker.type}
      />
    </ViewportItem>
  );
};
