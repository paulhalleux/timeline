import * as ResizablePanels from "react-resizable-panels";
import appStyles from "./App.module.css";
import styles from "./Timeline.module.css";
import { PANEL_MIN_SIZE } from "./App.tsx";
import {
  Playhead,
  Ruler,
  Timeline,
  TimelineProvider,
  Track,
  useTimeline,
  ViewportItem,
} from "@ptl/timeline-react";
import React from "react";
import {
  MinimapModule,
  PlayheadModule,
  RulerModule,
  SelectionModule,
  Timeline as TimelineCore,
  ViewportDragModule,
} from "@ptl/timeline-core";
import { useSignal, useSignalSelector } from "@ptl/signal-react";
import { useSubtitleEditor } from "./store.ts";

export const TimelinePanel = () => {
  const timeline = useTimeline();
  const headerOffsetPx = useSignal(
    timeline
      .getViewport()
      .getStore()
      .map((s) => s.headerOffsetPx),
  );

  const ctx = useSubtitleEditor();
  const subtitles = useSignalSelector(([state]) => state.subtitles, [
    ctx.store,
  ] as const);

  const selectionModule = SelectionModule.for(timeline);
  const selectedIds = useSignal(
    selectionModule.getStore().map((s) => s.selectedIds),
  );

  return (
    <ResizablePanels.Panel minSize={PANEL_MIN_SIZE} className={appStyles.panel}>
      <Timeline.Root>
        <Timeline.Layers>
          <Timeline.Overlay style={{ overflow: "hidden" }}>
            <Playhead.Root>
              <Playhead.Head
                style={{
                  left: -6,
                  width: 14,
                  height: 10,
                  backgroundColor: "darksalmon",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                }}
              />
              <Playhead.Bar style={{ background: "darksalmon" }} />
              <Playhead.Handle />
            </Playhead.Root>
          </Timeline.Overlay>
          <Timeline.Viewport>
            <Ruler.Root className={styles.ruler}>
              <Ruler.Header className={styles.rulerHeader}>Ruler</Ruler.Header>
              <Ruler.Ticks>
                {({ unit, left, width }) => (
                  <div className={styles.tickContainer} style={{ width, left }}>
                    <div className={styles.tickLabel}>{unit}</div>
                  </div>
                )}
              </Ruler.Ticks>
            </Ruler.Root>
            <div>
              {subtitles?.map(({ label, document }) => (
                <Track.Root
                  key={label}
                  height={40}
                  style={{ borderBottom: "1px solid var(--tl-color-border)" }}
                >
                  <Track.Header
                    style={{
                      background: "var(--tl-color-bg)",
                      borderRight: "1px solid var(--tl-color-border)",
                    }}
                  >
                    {label}
                  </Track.Header>
                  <Track.Content>
                    {document.getCues().map((cue) => (
                      <ViewportItem
                        key={cue.start.raw}
                        start={cue.start.milliseconds}
                        end={cue.end.milliseconds}
                        className={`${styles.cue} ${
                          selectedIds.has(cue.start.raw)
                            ? styles.cueSelected
                            : ""
                        }`}
                        onClick={() => {
                          if (selectedIds.has(cue.start.raw)) {
                            selectionModule.deselect(cue.start.raw);
                          } else selectionModule.select(cue.start.raw);
                        }}
                      >
                        <span className={styles.text}>{cue.text}</span>
                      </ViewportItem>
                    ))}
                  </Track.Content>
                </Track.Root>
              ))}
            </div>
          </Timeline.Viewport>
          <Timeline.Layer
            layer={0}
            className={styles.headersPlaceholder}
            style={{
              width: headerOffsetPx,
            }}
          />
        </Timeline.Layers>
      </Timeline.Root>
    </ResizablePanels.Panel>
  );
};

export const TimelinePanelProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [timeline] = React.useState(() => {
    return new TimelineCore({
      minVisibleRange: 25000,
      maxVisibleRange: 500000,
      chunkSize: 10,
      headerOffsetPx: 300,
      modules: [
        new RulerModule(),
        new PlayheadModule(),
        new MinimapModule({
          initialTotalRange: 2000000,
          // computeTotalRange: (timeline) => {
          //   const current = timeline.getBounds().start;
          //   const overflow = 2000000 - timeline.getVisibleRange();
          //   const range =
          //     2000000 + (current > overflow ? current - overflow : 0);
          //   return { range, overflow: Math.max(0, range - 2000000) };
          // },
        }),
        new ViewportDragModule(),
        new SelectionModule(),
      ],
    });
  });

  return <TimelineProvider timeline={timeline}>{children}</TimelineProvider>;
};