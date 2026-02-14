import * as React from "react";
import { BookmarkIcon, CaptionsIcon, SettingsIcon } from "lucide-react";

import { useMarkers, useTracks } from "../../core";
import { type ToolbarItem, VerticalToolbar } from "../ui";
import { SubtitleList } from "../subtitle-list";
import { MarkerList } from "../marker-list";
import styles from "./SidePanel.module.css";

// ============================================================================
// Panel Types
// ============================================================================

type PanelId = "subtitles" | "markers" | "settings";

// ============================================================================
// SidePanel
// ============================================================================

export const SidePanel: React.FC = () => {
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
      disabled: true, // Not implemented yet
    },
  ];

  const handleItemClick = (id: string) => {
    setActivePanel(id as PanelId);
  };

  return (
    <div className={styles.container}>
      <VerticalToolbar
        items={toolbarItems}
        activeId={activePanel}
        onItemClick={handleItemClick}
        bottomItems={bottomItems}
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
