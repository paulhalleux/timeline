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
  const isSelected = useIsMarkerSelected(marker.id);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) {
        editor.markers.toggleSelection(marker.id);
      } else {
        editor.markers.select(marker.id);
      }
      // Seek to marker time
      editor.playback.seek(marker.time);
    },
    [editor, marker.id, marker.time],
  );

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Seek to marker and select it
      editor.playback.seek(marker.time);
      editor.markers.select(marker.id);
    },
    [editor, marker.id, marker.time],
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
