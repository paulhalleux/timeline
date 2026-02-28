import React from "react";

import {
  createDocument,
  defaultRegistry,
  getDocumentDuration,
  updateDocumentMetadata,
} from "@ptl/subtitle";
import { type TimelineApi, WaveformModule } from "@ptl/timeline-core";
import { useTimeline } from "@ptl/timeline-react";

import { CaptionsIcon, PlusIcon, VideoIcon } from "lucide-react";

import type { SubtitleEditorApi } from "../../../core";
import { useSubtitleEditor } from "../../../core/react.tsx";
import { extractAudioPeaks } from "../../../utils/audio-extract.ts";
import { triggerFileImport } from "../../../utils/file-import.ts";
import { Menubar } from "../../ui/menubar";

type Option = {
  label: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  onClick?: (api: SubtitleEditorApi, timelineApi: TimelineApi) => void;
  submenu?: Option[];
};

type MenuItem = {
  label: string;
  groups?: MenuItem[];
  items?: Option[];
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
          api.addDocument(
            updateDocumentMetadata(document, {
              id: crypto.randomUUID(),
              name: files[0].name,
            }),
          );
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

const importVideoFile = (_api: SubtitleEditorApi, timelineApi: TimelineApi) => {
  triggerFileImport({
    accept: "audio/*,video/*,.mp3,.wav,.ogg,.mp4,.webm,.mkv",
    onFiles: async (files) => {
      const file = files[0];
      if (!file) {
        alert("No file selected.");
        return;
      }

      try {
        const { peaks, durationMs } = await extractAudioPeaks(file, 200);
        const waveform = WaveformModule.for(timelineApi);
        waveform.setPeaks(peaks, durationMs);
        timelineApi.setVisibleRange(durationMs);
      } catch (err) {
        console.error("Failed to extract audio:", err);
        alert("Failed to extract audio from the file.");
      }
    },
  });
};

const createNewDocument =
  (format: "srt" | "vtt") =>
  (api: SubtitleEditorApi, timelineApi: TimelineApi) => {
    const document = createDocument({
      format,
      metadata: {
        id: crypto.randomUUID(),
        name: `New ${format.toUpperCase()} Document`,
      },
      cues: [],
    });

    api.addDocument(document);
    timelineApi.setVisibleRange(getDocumentDuration(document));
  };

const MENU_ITEMS: MenuItem[] = [
  {
    label: "File",
    groups: [
      {
        label: "New",
        items: [
          {
            label: "New Document",
            icon: PlusIcon,
            submenu: [
              { label: "New SRT Document", onClick: createNewDocument("srt") },
              { label: "New VTT Document", onClick: createNewDocument("vtt") },
            ],
          },
        ],
      },
      {
        label: "Import",
        items: [
          {
            icon: VideoIcon,
            label: "Import Video File",
            onClick: importVideoFile,
          },
          {
            icon: CaptionsIcon,
            label: "Import Subtitle File",
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
                  <MenuOption
                    key={item.label}
                    item={item}
                    api={api}
                    timeline={timeline}
                  />
                ))}
              </Menubar.Group>
            ))}
            {menu.items?.map((item) => (
              <MenuOption
                key={item.label}
                item={item}
                api={api}
                timeline={timeline}
              />
            ))}
          </Menubar.Content>
        </Menubar.Menu>
      ))}
    </Menubar.Root>
  );
};

const MenuOptionContent = ({ item }: { item: Option }) => (
  <>
    {item.icon ? (
      <item.icon size={15} className="text-gray-400" />
    ) : (
      <div className="w-3.75" />
    )}
    {item.label}
  </>
);

const MenuOption = ({
  item,
  api,
  timeline,
}: {
  item: Option;
  api: SubtitleEditorApi;
  timeline: TimelineApi;
}) => {
  if (item.submenu && item.submenu.length > 0) {
    return (
      <Menubar.Submenu>
        <Menubar.SubmenuTrigger>
          <MenuOptionContent item={item} />
        </Menubar.SubmenuTrigger>
        <Menubar.SubmenuContent>
          {item.submenu.map((sub) => (
            <MenuOption
              key={sub.label}
              item={sub}
              api={api}
              timeline={timeline}
            />
          ))}
        </Menubar.SubmenuContent>
      </Menubar.Submenu>
    );
  }

  return (
    <Menubar.Item onClick={() => item.onClick?.(api, timeline)}>
      <MenuOptionContent item={item} />
    </Menubar.Item>
  );
};
