import { defaultRegistry, getDocumentDuration } from "@ptl/subtitle";
import type { TimelineApi } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";
import { CaptionsIcon, VideoIcon } from "lucide-react";
import React from "react";

import type { SubtitleEditorApi } from "../../../core";
import { useSubtitleEditor } from "../../../core/react.tsx";
import { triggerFileImport } from "../../../utils/file-import.ts";
import { Menubar } from "../../ui/menubar";

type MenuItem = {
  label: string;
  groups?: MenuItem[];
  items?: {
    label: string;
    icon?: React.ComponentType<{ size: number; className?: string }>;
    onClick?: (api: SubtitleEditorApi, timelineApi: TimelineApi) => void;
  }[];
  icon?: React.ComponentType<{ size: number; className?: string }>;
  disabled?: boolean;
};

const importSubtitle = (api: SubtitleEditorApi, timelineApi: TimelineApi) => {
  triggerFileImport({
    accept: ".srt,.vtt",
    onFiles: (files) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content !== "string") {
          alert("Failed to read subtitle file.");
          return;
        }

        const document = defaultRegistry.parse(content);
        if (document) {
          api.setDocument(document);
          timelineApi.setVisibleRange(getDocumentDuration(document));
        } else {
          alert("Failed to parse subtitle file.");
        }
      };

      const file = files[0];
      if (!file) {
        alert("No file selected.");
        return;
      }
      reader.readAsText(file);
    },
  });
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "File",
    groups: [
      {
        label: "Import",
        items: [
          { icon: VideoIcon, label: "Import Video" },
          {
            icon: CaptionsIcon,
            label: "Import Subtitle",
            onClick: importSubtitle,
          },
        ],
      },
    ],
    items: [],
  },
  {
    label: "Edit",
    disabled: true,
    groups: [],
    items: [],
  },
  {
    label: "Help",
    disabled: true,
    groups: [],
    items: [],
  },
];

export const Menu = () => {
  const api = useSubtitleEditor();
  const timeline = useTimeline();

  return (
    <Menubar.Root>
      {MENU_ITEMS.map((menu) => (
        <Menubar.Menu key={menu.label}>
          <Menubar.Trigger disabled={menu.disabled}>
            {menu.label}
          </Menubar.Trigger>
          <Menubar.Content>
            {menu.groups?.map((group) => (
              <Menubar.Group key={group.label}>
                <Menubar.GroupLabel>
                  {group.icon ? (
                    <group.icon size={15} className="text-gray-400" />
                  ) : (
                    <div className="w-3.75" />
                  )}
                  {group.label}
                </Menubar.GroupLabel>
                {group.items?.map((item) => (
                  <Menubar.Item
                    key={item.label}
                    onClick={() => item.onClick?.(api, timeline)}
                  >
                    {item.icon ? (
                      <item.icon size={15} className="text-gray-400" />
                    ) : (
                      <div className="w-3.75" />
                    )}
                    {item.label}
                  </Menubar.Item>
                ))}
              </Menubar.Group>
            ))}
            {menu.items?.map((item) => (
              <Menubar.Item
                key={item.label}
                onClick={() => item.onClick?.(api, timeline)}
              >
                {item.icon && <item.icon size={15} className="text-gray-400" />}
                {item.label}
              </Menubar.Item>
            ))}
          </Menubar.Content>
        </Menubar.Menu>
      ))}
    </Menubar.Root>
  );
};
