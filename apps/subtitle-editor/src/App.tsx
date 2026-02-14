import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";

import styles from "./App.module.css";
import { Canvas } from "./components/canvas-panel/Canvas.tsx";
import { ContentPanel } from "./components/content-panel";
import { Controls } from "./components/controls-panel/Controls.tsx";
import { Edit } from "./components/edit-panel/Edit.tsx";
import { Menu } from "./components/menu-panel/Menu.tsx";
import { TimelinePanel } from "./components/timeline/Timeline.tsx";
import { Panel } from "./components/ui";
import { EditorProvider, useEditorKeyboardShortcuts } from "./core";

/** Minimum width/height for canvas panel */
export const CANVAS_MIN_SIZE = 600;
/** Minimum width/height for side panels */
export const PANEL_MIN_SIZE = 320;
/** Fixed height for menu/control bars */
export const BAR_HEIGHT = 32;
/** Default size for side panels */
export const DEFAULT_SIDE_PANEL_SIZE = 400;

/**
 * Inner app content with keyboard shortcuts enabled.
 */
const AppContent: React.FC = () => {
  // Setup global keyboard shortcuts
  useEditorKeyboardShortcuts();

  return (
    <div className={styles.container}>
      <ResizablePanels.Group orientation="vertical" className={styles.col}>
        <Panel defaultSize={BAR_HEIGHT} minSize={BAR_HEIGHT} disabled>
          <Menu />
        </Panel>
        <ResizablePanels.Panel>
          <ResizablePanels.Group orientation="vertical" className={styles.col}>
            <ResizablePanels.Panel minSize={PANEL_MIN_SIZE}>
              <ResizablePanels.Group
                orientation="horizontal"
                className={styles.row}
              >
                <Panel
                  minSize={PANEL_MIN_SIZE}
                  defaultSize={DEFAULT_SIDE_PANEL_SIZE}
                >
                  <ContentPanel />
                </Panel>
                <ResizablePanels.Panel minSize={CANVAS_MIN_SIZE}>
                  <ResizablePanels.Group
                    orientation="vertical"
                    className={styles.col}
                  >
                    <Panel minSize={PANEL_MIN_SIZE}>
                      <Canvas />
                    </Panel>
                    <Panel
                      defaultSize={BAR_HEIGHT}
                      minSize={BAR_HEIGHT}
                      maxSize={BAR_HEIGHT}
                      disabled
                    >
                      <Controls />
                    </Panel>
                  </ResizablePanels.Group>
                </ResizablePanels.Panel>
                <Panel
                  minSize={PANEL_MIN_SIZE}
                  defaultSize={DEFAULT_SIDE_PANEL_SIZE}
                >
                  <Edit />
                </Panel>
              </ResizablePanels.Group>
            </ResizablePanels.Panel>
            <Panel minSize={PANEL_MIN_SIZE}>
              <TimelinePanel />
            </Panel>
          </ResizablePanels.Group>
        </ResizablePanels.Panel>
      </ResizablePanels.Group>
    </div>
  );
};

/**
 * Main application component with resizable panel layout.
 */
export const App: React.FC = () => {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
};
