import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@ptl/ui";
import type { ActionDescriptor, ActionSource } from "@ptl/action-core";
import type { ActionRunner } from "@ptl/action-react";
import { formatForDisplay } from "@tanstack/react-hotkeys";

const menus = [
  { id: "file", label: "File" },
  { id: "edit", label: "Edit" },
  { id: "view", label: "View" },
  { id: "timeline", label: "Timeline" },
];

interface AppMenubarProps {
  runner: ActionRunner;
}

export const AppMenubar = ({ runner }: AppMenubarProps) => {
  return (
    <Menubar className="h-8 w-full border-b! rounded-none!">
      <div className="px-2 text-xs font-semibold text-muted-foreground">ST</div>
      <MenubarMenu>
        {menus.map((menu) => (
          <ActionMenu key={menu.id} label={menu.label} menu={menu.id} runner={runner} />
        ))}
      </MenubarMenu>
    </Menubar>
  );
};

interface ActionMenuProps {
  label: string;
  menu: string;
  runner: ActionRunner;
}

const ActionMenu = ({ label, menu, runner }: ActionMenuProps) => {
  const groups = groupMenuActions(getMenuActions(runner.list(), menu));

  if (groups.length === 0) return null;

  return (
    <MenubarMenu>
      <MenubarTrigger>{label}</MenubarTrigger>
      <MenubarContent className="w-52">
        {groups.map((actions, groupIndex) => (
          <MenubarGroup key={actions.map((action) => action.id).join(":")}>
            {groupIndex > 0 && <MenubarSeparator />}
            {actions.map((action) => (
              <ActionMenuItem key={action.id} action={action} runner={runner} source="menu" />
            ))}
          </MenubarGroup>
        ))}
      </MenubarContent>
    </MenubarMenu>
  );
};

interface ActionMenuItemProps {
  action: ActionDescriptor;
  runner: ActionRunner;
  source: ActionSource;
}

const ActionMenuItem = ({ action, runner, source }: ActionMenuItemProps) => {
  const state = runner.getState?.(action.id) ?? { visible: true, enabled: true };

  if (!state.visible) return null;

  return (
    <MenubarItem
      disabled={!state.enabled}
      onClick={() => void runner.run(action.id, { source })}
      title={state.disabledReason}
    >
      <span className="min-w-0 flex-1 truncate">{action.title}</span>
      {action.keybindings?.[0] && (
        <MenubarShortcut>
          {formatForDisplay(
            Array.isArray(action.keybindings[0].keys)
              ? action.keybindings[0].keys[0]
              : action.keybindings[0].keys,
          )}
        </MenubarShortcut>
      )}
    </MenubarItem>
  );
};

function getMenuActions(actions: readonly ActionDescriptor[], menu: string) {
  return actions
    .filter((action) => action.presentation?.menu?.path[0]?.toLowerCase() === menu)
    .sort((a, b) => {
      const order =
        (a.presentation?.menu?.order ?? a.order ?? 0) -
        (b.presentation?.menu?.order ?? b.order ?? 0);
      return order === 0 ? a.title.localeCompare(b.title) : order;
    });
}

function groupMenuActions(actions: readonly ActionDescriptor[]) {
  const groups = new Map<string, ActionDescriptor[]>();
  for (const action of actions) {
    const group = action.presentation?.menu?.path[1] ?? "default";
    groups.set(group, [...(groups.get(group) ?? []), action]);
  }
  return [...groups.values()];
}
