import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";

import styles from "./App.module.css";
import { BAR_HEIGHT } from "./App.tsx";
import { Button } from "./components/ui";
import { useEditor } from "./core";

/* ============================================================================
 * Icons
 * ========================================================================== */

const VideoIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);

const SubtitleIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
  </svg>
);

/* ============================================================================
 * FileInputButton
 * ========================================================================== */

interface FileInputButtonProps {
  label: string;
  accept: string;
  icon?: React.ReactNode;
  onFileSelect: (file: File) => void;
}

const FileInputButton: React.FC<FileInputButtonProps> = ({
  label,
  accept,
  icon,
  onFileSelect,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        iconStart={icon}
        onClick={handleClick}
      >
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        hidden
      />
    </>
  );
};

/* ============================================================================
 * Menu
 * ========================================================================== */

/**
 * Application menu bar with file import controls.
 */
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
    <ResizablePanels.Panel
      defaultSize={BAR_HEIGHT}
      minSize={BAR_HEIGHT}
      disabled
      className={styles.panel}
    >
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
          icon={<SubtitleIcon />}
          onFileSelect={handleSubtitleLoad}
        />
      </div>
    </ResizablePanels.Panel>
  );
};
