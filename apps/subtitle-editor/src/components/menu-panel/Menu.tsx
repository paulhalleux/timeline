import { SubtitlesIcon, VideoIcon } from "lucide-react";
import * as React from "react";

import { useEditor } from "../../core";
import { FileInputButton } from "../ui";
import styles from "./Menu.module.css";

export const Menu: React.FC = () => {
  const editor = useEditor();

  const handleVideoLoad = React.useCallback(
    (file: File) => {
      editor.loadMedia(file).catch(console.error);
    },
    [editor],
  );

  const handleSubtitleLoad = React.useCallback(
    (file: File) => {
      editor.loadSubtitleFile(file).catch(console.error);
    },
    [editor],
  );

  return (
    <div className={styles.menu}>
      <FileInputButton
        label="Import Video"
        accept="video/*"
        icon={<VideoIcon />}
        onFileSelect={handleVideoLoad}
      />
      <FileInputButton
        label="Import Subtitles"
        accept=".srt,.vtt"
        icon={<SubtitlesIcon />}
        onFileSelect={handleSubtitleLoad}
      />
    </div>
  );
};
