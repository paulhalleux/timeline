import { useSignal } from "@ptl/signal-react";
import { Timeline, Translate, useTimeline } from "@ptl/timeline-react";
import { Package2Icon } from "lucide-react";
import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";

import appStyles from "../../App.module.css";
import { PANEL_MIN_SIZE } from "../../App.tsx";
import { useMarkers, useTracks } from "../../core";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import { SubtitleTrackComponent } from "./SubtitleTrack.tsx";
import styles from "./TimelineComponents.module.css";
import { TimelineFooter } from "./TimelineFooter.tsx";
import { TimelineMarkerItem } from "./TimelineMarker.tsx";
import { TimelinePlayhead } from "./TimelinePlayhead.tsx";
import { TimelineRuler } from "./TimelineRuler.tsx";

export const TimelinePanel: React.FC = () => {
  const timeline = useTimeline();
  const headerOffsetPx = useSignal(
    timeline
      .getViewport()
      .getStore()
      .map((s) => s.headerOffsetPx),
  );

  const tracks = useTracks();
  const markers = useMarkers();

  const isEmpty = tracks.length === 0;

  return (
    <ResizablePanels.Panel minSize={PANEL_MIN_SIZE} className={appStyles.panel}>
      <Timeline.Root>
        <Timeline.Layers>
          {!isEmpty && (
            <Timeline.Overlay style={{ overflow: "hidden" }}>
              <TimelinePlayhead />
              <Translate style={{ width: "100%", height: "100%" }}>
                {markers.map((marker) => (
                  <TimelineMarkerItem key={marker.id} marker={marker} />
                ))}
              </Translate>
            </Timeline.Overlay>
          )}
          <Timeline.Viewport>
            {!isEmpty ? (
              <>
                <TimelineRuler />
                <div>
                  {tracks.map((track) => (
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
        <TimelineFooter />
      </Timeline.Root>
    </ResizablePanels.Panel>
  );
};
