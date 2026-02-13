import styles from "./App.module.css";
import * as ResizablePanels from "react-resizable-panels";
import { BAR_HEIGHT } from "./App.tsx";
import { useSubtitleEditor } from "./store.ts";

export const Menu = () => {
  const ctx = useSubtitleEditor();

  return (
    <ResizablePanels.Panel
      defaultSize={BAR_HEIGHT}
      minSize={BAR_HEIGHT}
      disabled
      className={styles.panel}
    >
      <input
        type="file"
        accept="*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            ctx.loadVideo(file);
          }
        }}
      />
      <input
        type="file"
        accept=".srt,.vtt"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            ctx.loadSubtitles(file);
          }
        }}
      />
    </ResizablePanels.Panel>
  );
};