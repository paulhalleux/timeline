import { useSignalSelector } from "@ptl/signal-react";
import { SnappingModule } from "@ptl/subtitle-editor-core";
import { Translate, useTimeline } from "@ptl/timeline-react";
import * as React from "react";

import { useEditor } from "../../core";
import styles from "./SnapIndicator.module.css";

/**
 * Visual indicator showing where snapping will occur.
 * Renders a vertical line at the active snap target position.
 */
export const SnapIndicator: React.FC = () => {
  const editor = useEditor();
  const timeline = useTimeline();
  const snappingModule = SnappingModule.for(editor);

  const activeSnapTarget = useSignalSelector(
    ([state]) => state.activeSnapTarget,
    [snappingModule.getStore()] as const,
  );

  if (activeSnapTarget === null) {
    return null;
  }

  const left = timeline.projectToChunk(activeSnapTarget);

  return (
    <Translate className={styles.container}>
      <div className={styles.line} style={{ left }} />
    </Translate>
  );
};
