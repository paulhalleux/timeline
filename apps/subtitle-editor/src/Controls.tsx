import styles from "./App.module.css";
import * as ResizablePanels from "react-resizable-panels";
import { BAR_HEIGHT } from "./App.tsx";
import { useSignalSelector } from "@ptl/signal-react";
import { useSubtitleEditor } from "./store.ts";

export const Controls = () => {
  const ctx = useSubtitleEditor();
  const media = useSignalSelector(([state]) => state.media, [
    ctx.store,
  ] as const);

  return (
    <ResizablePanels.Panel
      defaultSize={BAR_HEIGHT}
      minSize={BAR_HEIGHT}
      disabled
      className={styles.panel}
    >
      {JSON.stringify(media?.subtitles)}
    </ResizablePanels.Panel>
  );
};