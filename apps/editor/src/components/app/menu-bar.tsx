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
import type { ActionDefinition, ActionTriggerSource } from "@ptl/actions";
import { getMenuActions, groupPlacedActions } from "../../actions/layout";
import { formatShortcut } from "../../actions/shortcut";
import type { EditorActionServices } from "../../actions/services";
import type { EditorActionRuntime } from "../../actions/use-editor-actions";

const menus = [
  { id: "file", label: "File" },
  { id: "edit", label: "Edit" },
  { id: "view", label: "View" },
  { id: "tools", label: "Tools" },
];

interface AppMenubarProps {
  runtime: EditorActionRuntime;
}

export const AppMenubar = ({ runtime }: AppMenubarProps) => {
  return (
    <Menubar className="h-8 w-full border-b! rounded-none!">
      <div className="px-2 text-xs font-semibold text-muted-foreground">ST</div>
      {menus.map((menu) => (
        <ActionMenu key={menu.id} label={menu.label} menu={menu.id} runtime={runtime} />
      ))}
    </Menubar>
  );
};

interface ActionMenuProps {
  label: string;
  menu: string;
  runtime: EditorActionRuntime;
}

const ActionMenu = ({ label, menu, runtime }: ActionMenuProps) => {
  const groups = groupPlacedActions(getMenuActions(runtime.actions, menu));

  if (groups.length === 0) return null;

  return (
    <MenubarMenu>
      <MenubarTrigger>{label}</MenubarTrigger>
      <MenubarContent className="w-52">
        {groups.map((actions, groupIndex) => (
          <MenubarGroup key={actions.map(({ action }) => action.descriptor.id).join(":")}>
            {groupIndex > 0 && <MenubarSeparator />}
            {actions.map(({ action }) => (
              <ActionMenuItem
                key={action.descriptor.id}
                action={action}
                runtime={runtime}
                source="menubar"
              />
            ))}
          </MenubarGroup>
        ))}
      </MenubarContent>
    </MenubarMenu>
  );
};

interface ActionMenuItemProps {
  action: ActionDefinition<EditorActionServices>;
  runtime: EditorActionRuntime;
  source: ActionTriggerSource;
}

const ActionMenuItem = ({ action, runtime, source }: ActionMenuItemProps) => {
  const state = runtime.getActionState(action);

  if (!state.visible) return null;

  return (
    <MenubarItem
      disabled={!state.enabled}
      onClick={() => void runtime.execute(action.descriptor.id, source)}
      title={state.reason}
    >
      <span className="min-w-0 flex-1 truncate">
        {state.checked ? "✓ " : ""}
        {action.descriptor.title}
      </span>
      {action.descriptor.shortcuts?.[0] && (
        <MenubarShortcut>{formatShortcut(action.descriptor.shortcuts[0])}</MenubarShortcut>
      )}
    </MenubarItem>
  );
};
