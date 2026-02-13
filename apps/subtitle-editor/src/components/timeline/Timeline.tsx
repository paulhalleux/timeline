import * as ResizablePanels from "react-resizable-panels";
import appStyles from "../../App.module.css";
import styles from "./TimelineComponents.module.css";
import { PANEL_MIN_SIZE } from "../../App.tsx";
import { Timeline, useTimeline } from "@ptl/timeline-react";
import * as React from "react";
import { useSignal, useSignalSelector } from "@ptl/signal-react";
import { useSubtitleEditor } from "../../store";
import { TimelinePlayhead } from "./TimelinePlayhead.tsx";
import { TimelineRuler } from "./TimelineRuler.tsx";
import { SubtitleTrackComponent } from "./SubtitleTrack.tsx";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import { Package2Icon } from "lucide-react";

export const TimelinePanel: React.FC = () => {
  const timeline = useTimeline();
  const headerOffsetPx = useSignal(
    timeline
      .getViewport()
      .getStore()
      .map((s) => s.headerOffsetPx),
  );

  const { store } = useSubtitleEditor();
  const subtitles = useSignalSelector(([state]) => state.subtitles, [
    store,
  ] as const);

  const isEmpty = subtitles.length === 0;

  return (
    <ResizablePanels.Panel minSize={PANEL_MIN_SIZE} className={appStyles.panel}>
      <Timeline.Root>
        <Timeline.Layers>
          {!isEmpty && (
            <Timeline.Overlay style={{ overflow: "hidden" }}>
              <TimelinePlayhead />
            </Timeline.Overlay>
          )}
          <Timeline.Viewport>
            {!isEmpty ? (
              <>
                <TimelineRuler />
                <div>
                  {subtitles.map((track) => (
                    <SubtitleTrackComponent key={track.id} track={track} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Package2Icon size={48} />}
                title="No subtitles"
                description="Add subtitles to see them here."
              />
            )}
          </Timeline.Viewport>
          {!isEmpty && (
            <Timeline.Layer
              layer={0}
              className={styles.headersPlaceholder}
              style={{ width: headerOffsetPx }}
            />
          )}
        </Timeline.Layers>
      </Timeline.Root>
    </ResizablePanels.Panel>
  );
};
