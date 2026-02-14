import { TextIcon } from "lucide-react";
import React from "react";

import { CueEditor } from "../cue-editor/CueEditor.tsx";
import { type ToolbarItem, VerticalToolbar } from "../ui";
import styles from "./Edit.module.css";

// ============================================================================
// Panel Types
// ============================================================================

type PanelId = "cue";

// ============================================================================
// EditPanel
// ============================================================================

export const Edit: React.FC = () => {
  const [activePanel, setActivePanel] = React.useState<PanelId>("cue");

  const toolbarItems: ToolbarItem[] = [
    {
      id: "cue",
      icon: <TextIcon size={18} />,
      label: "Cue Editor",
    },
  ];

  const handleItemClick = (id: string) => {
    setActivePanel(id as PanelId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {activePanel === "cue" && <CueEditor />}
      </div>
      <VerticalToolbar
        items={toolbarItems}
        activeId={activePanel}
        onItemClick={handleItemClick}
        position="right"
      />
    </div>
  );
};
