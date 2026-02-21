import { CaptionsIcon, VideoIcon } from "lucide-react";
import React from "react";

import { Menubar } from "../../ui/menubar";

type MenuItem = {
  label: string;
  groups?: MenuItem[];
  items?: MenuItem[];
  icon?: React.ComponentType<{ size: number; className?: string }>;
  disabled?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "File",
    groups: [
      {
        label: "Import",
        items: [
          { icon: VideoIcon, label: "Import Video" },
          { icon: CaptionsIcon, label: "Import Subtitle" },
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
                  <Menubar.Item key={item.label}>
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
              <Menubar.Item key={item.label}>
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
