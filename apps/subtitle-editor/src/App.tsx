import * as ResizablePanels from "react-resizable-panels";
import styles from "./App.module.css";
import { createSubtitleEditor, SubtitleEditorContext } from "./store.ts";
import * as React from "react";
import { Menu } from "./Menu.tsx";
import { Canvas } from "./Canvas.tsx";
import { Controls } from "./Controls.tsx";
import { TimelinePanel } from "./Timeline.tsx";
import { useTimeline } from "@ptl/timeline-react";

export const CANVAS_MIN_SIZE = 600;
export const PANEL_MIN_SIZE = 320;
export const BAR_HEIGHT = 32;

export const App = () => {
  const timeline = useTimeline()
  const [editor] = React.useState(() => {
    return createSubtitleEditor(timeline);
  });

  return (
    <SubtitleEditorContext value={editor}>
      <div className={styles.container}>
        <ResizablePanels.Group orientation="vertical" className={styles.col}>
          <Menu />
          <ResizablePanels.Panel>
            <ResizablePanels.Group
              orientation="vertical"
              className={styles.col}
            >
              <ResizablePanels.Panel minSize={PANEL_MIN_SIZE}>
                <ResizablePanels.Group
                  orientation="horizontal"
                  className={styles.row}
                >
                  <ResizablePanels.Panel
                    minSize={PANEL_MIN_SIZE}
                    className={styles.panel}
                  >
                    List
                  </ResizablePanels.Panel>
                  <ResizablePanels.Panel minSize={CANVAS_MIN_SIZE}>
                    <ResizablePanels.Group
                      orientation="vertical"
                      className={styles.col}
                    >
                      <Canvas />
                      <Controls />
                    </ResizablePanels.Group>
                  </ResizablePanels.Panel>
                  <ResizablePanels.Panel
                    minSize={PANEL_MIN_SIZE}
                    className={styles.panel}
                  >
                    Edit
                  </ResizablePanels.Panel>
                </ResizablePanels.Group>
              </ResizablePanels.Panel>
              <TimelinePanel />
            </ResizablePanels.Group>
          </ResizablePanels.Panel>{" "}
        </ResizablePanels.Group>
      </div>
    </SubtitleEditorContext>
  );
};