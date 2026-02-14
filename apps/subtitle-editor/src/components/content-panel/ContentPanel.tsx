import { BookmarkIcon, CaptionsIcon, SettingsIcon } from "lucide-react";
import * as React from "react";

import { useMarkers, useTracks } from "../../core";
import { MarkerList } from "../marker-list";
import { SubtitleList } from "../subtitle-list";
import { type ToolbarItem, VerticalToolbar } from "../ui";
import styles from "./ContentPanel.module.css";

// ============================================================================
// Panel Types
// ============================================================================

type PanelId = "subtitles" | "markers" | "settings";

// ============================================================================
// ContentPanel
// ============================================================================

export const ContentPanel: React.FC = () => {
  const [activePanel, setActivePanel] = React.useState<PanelId>("subtitles");

  const tracks = useTracks();
  const markers = useMarkers();

  const toolbarItems: ToolbarItem[] = [
    {
      id: "subtitles",
      icon: <CaptionsIcon size={18} />,
      label: "Subtitles",
      badge: tracks.length > 0 ? tracks.length : undefined,
    },
    {
      id: "markers",
      icon: <BookmarkIcon size={18} />,
      label: "Markers",
      badge: markers.length > 0 ? markers.length : undefined,
    },
  ];

  const bottomItems: ToolbarItem[] = [
    {
      id: "settings",
      icon: <SettingsIcon size={18} />,
      label: "Settings",
    },
  ];

  const handleItemClick = (id: string) => {
    setActivePanel(id as PanelId);
  };

  return (
    <div className={styles.container}>
      <VerticalToolbar
        items={toolbarItems}
        bottomItems={bottomItems}
        activeId={activePanel}
        onItemClick={handleItemClick}
        position="left"
      />
      <div className={styles.content}>
        {activePanel === "subtitles" && <SubtitleList />}
        {activePanel === "markers" && <MarkerList />}
        {activePanel === "settings" && (
          <div
            style={{
              padding: "var(--space-4)",
              color: "var(--color-text-secondary)",
            }}
          >
            Settings panel coming soon...
          </div>
        )}
      </div>
    </div>
  );
};
