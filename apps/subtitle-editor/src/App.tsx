import * as ResizablePanels from "react-resizable-panels";
import styles from "./App.module.css";
import { SubtitleEditorProvider } from "./store";
import * as React from "react";
import { Menu } from "./Menu.tsx";
import { Canvas } from "./Canvas.tsx";
import { Controls } from "./Controls.tsx";
import { TimelinePanel } from "./components/timeline/Timeline.tsx";
import { SubtitleList } from "./components/subtitle-list";
import { useTimeline } from "@ptl/timeline-react";

/** Minimum width/height for canvas panel */
export const CANVAS_MIN_SIZE = 600;
/** Minimum width/height for side panels */
export const PANEL_MIN_SIZE = 320;
/** Fixed height for menu/control bars */
export const BAR_HEIGHT = 32;

/**
 * Main application component with resizable panel layout.
 */
export const App: React.FC = () => {
  const timeline = useTimeline();

  return (
    <SubtitleEditorProvider timeline={timeline}>
      <div className={styles.container}>
        <ResizablePanels.Group orientation="vertical" className={styles.col}>
          <Menu />
          <ResizablePanels.Panel>
            <ResizablePanels.Group orientation="vertical" className={styles.col}>
              <ResizablePanels.Panel minSize={PANEL_MIN_SIZE}>
                <ResizablePanels.Group orientation="horizontal" className={styles.row}>
                  <ResizablePanels.Panel
                    minSize={PANEL_MIN_SIZE}
                    className={styles.panel}
                  >
                    <SubtitleList />
                  </ResizablePanels.Panel>
                  <ResizablePanels.Panel minSize={CANVAS_MIN_SIZE}>
                    <ResizablePanels.Group orientation="vertical" className={styles.col}>
                      <Canvas />
                      <Controls />
                    </ResizablePanels.Group>
                  </ResizablePanels.Panel>
                  <ResizablePanels.Panel
                    minSize={PANEL_MIN_SIZE}
                    className={styles.panel}
                  >
                    {/* TODO: Edit panel */}
                    <div className={styles.placeholder}>Edit Panel</div>
                  </ResizablePanels.Panel>
                </ResizablePanels.Group>
              </ResizablePanels.Panel>
              <TimelinePanel />
            </ResizablePanels.Group>
          </ResizablePanels.Panel>
        </ResizablePanels.Group>
      </div>
    </SubtitleEditorProvider>
  );
};