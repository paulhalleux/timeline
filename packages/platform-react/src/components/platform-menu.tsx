import {
  type CommandDefinition,
  isContributionEnabled,
  type MenuContribution,
  type MenuCommandContribution,
  type MenuToggleContribution,
} from "@ptl/platform-core";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@ptl/ui";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import * as React from "react";

import { usePlatform } from "../hooks/platform-provider";
import {
  getMenuContributionKey,
  getMenuContributionLabel,
  getMenuRoots,
  getVisibleMenuContributions,
  groupMenuContributions,
} from "../utils/menu-contributions";

export interface PlatformMenuProps<TContext = unknown> {
  menu: string;
  context: TContext;
  className?: string;
  groupClassName?: string;
  itemClassName?: string;
  empty?: React.ReactNode;
}

/**
 * Renders a single menu location from platform menu contributions.
 *
 * Command and toggle contributions render as buttons. Submenu contributions are
 * intentionally disabled here because full submenu behavior requires a menubar
 * or context-menu primitive.
 */
export function PlatformMenu<TContext = unknown>({
  menu,
  context,
  className,
  groupClassName,
  itemClassName,
  empty = null,
}: PlatformMenuProps<TContext>) {
  const { contributions } = usePlatform<TContext>();
  const menuContributions = React.useMemo(
    () =>
      groupMenuContributions(getVisibleMenuContributions(contributions.menus ?? [], menu, context)),
    [context, contributions.menus, menu],
  );

  if (menuContributions.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className={className} data-platform-menu={menu}>
      {menuContributions.map((group) => (
        <div
          className={groupClassName}
          data-platform-menu-group={group[0]?.group ?? "default"}
          key={group.map(getMenuContributionKey).join(":")}
        >
          {group.map((contribution) => (
            <PlatformMenuButton
              className={itemClassName}
              contribution={contribution}
              context={context}
              key={getMenuContributionKey(contribution)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface MenuBarProps<TContext = unknown> {
  menu: string;
  context: TContext;
  className?: string;
  contentClassName?: string;
  leading?: React.ReactNode;
}

/**
 * Renders a top-level menu bar from platform menu roots and child locations.
 *
 * Explicit `menuRoots` contributions control labels and ordering. If none are
 * provided, roots are inferred from child menu IDs such as `main.file`.
 */
export function MenuBar<TContext = unknown>({
  menu,
  context,
  className,
  contentClassName,
  leading,
}: MenuBarProps<TContext>) {
  const { contributions } = usePlatform<TContext>();
  const roots = getMenuRoots(contributions.menuRoots, contributions.menus ?? [], menu, context);

  return (
    <Menubar className={className}>
      {leading}
      {roots.map((root) => (
        <MenubarMenu key={root.menu}>
          <MenubarTrigger>{root.label}</MenubarTrigger>
          <MenubarContent className={contentClassName}>
            <MenubarMenuItems context={context} menu={root.menu} />
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
}

export interface PlatformContextMenuProps<TContext = unknown> extends PlatformMenuProps<TContext> {
  children: React.ReactNode;
}

export function PlatformContextMenu<TContext = unknown>({
  children,
  ...props
}: PlatformContextMenuProps<TContext>) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItems {...props} />
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function MenubarMenuItems<TContext = unknown>({
  menu,
  context,
}: {
  menu: string;
  context: TContext;
}) {
  const { contributions } = usePlatform<TContext>();
  const groups = groupMenuContributions(
    getVisibleMenuContributions(contributions.menus ?? [], menu, context),
  );

  return (
    <>
      {groups.map((group, groupIndex) => (
        <MenubarGroup key={group.map(getMenuContributionKey).join(":")}>
          {groupIndex > 0 && <MenubarSeparator />}
          {group.map((contribution) => (
            <MenubarMenuContribution
              contribution={contribution}
              context={context}
              key={getMenuContributionKey(contribution)}
            />
          ))}
        </MenubarGroup>
      ))}
    </>
  );
}

function MenubarMenuContribution<TContext = unknown>({
  contribution,
  context,
}: {
  contribution: MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>;
  context: TContext;
}) {
  const { platform, contributions } = usePlatform<TContext>();
  const refreshMenuState = useMenuStateRefresh();

  if (contribution.kind === "submenu") {
    return (
      <MenubarSub>
        <MenubarSubTrigger>{getMenuContributionLabel(contribution)}</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarMenuItems context={context} menu={contribution.submenu} />
        </MenubarSubContent>
      </MenubarSub>
    );
  }

  const shortcut = contributions.shortcuts?.find(
    (item) => item.command.id === contribution.command.id,
  )?.shortcut;

  if (contribution.kind === "toggle") {
    return (
      <MenubarCheckboxItem
        checked={contribution.checked?.(context) ?? false}
        disabled={!isContributionEnabled(contribution, context)}
        onClick={() =>
          void refreshMenuState(() => platform.commands.execute(contribution.command, undefined))
        }
      >
        <span className="min-w-0 flex-1 truncate">{getMenuContributionLabel(contribution)}</span>
        {shortcut && <MenubarShortcut>{formatForDisplay(shortcut)}</MenubarShortcut>}
      </MenubarCheckboxItem>
    );
  }

  return (
    <MenubarItem
      disabled={!isContributionEnabled(contribution, context)}
      onClick={() =>
        void refreshMenuState(() => platform.commands.execute(contribution.command, undefined))
      }
    >
      <span className="min-w-0 flex-1 truncate">{getMenuContributionLabel(contribution)}</span>
      {shortcut && <MenubarShortcut>{formatForDisplay(shortcut)}</MenubarShortcut>}
    </MenubarItem>
  );
}

function ContextMenuItems<TContext = unknown>({
  menu,
  context,
  empty = null,
}: PlatformMenuProps<TContext>) {
  const { platform, contributions } = usePlatform<TContext>();
  const refreshMenuState = useMenuStateRefresh();
  const items = getVisibleMenuContributions(contributions.menus ?? [], menu, context);

  if (items.length === 0) {
    return <>{empty}</>;
  }

  return (
    <>
      {items.map((contribution) => {
        if (contribution.kind === "submenu") {
          return null;
        }

        return (
          <ContextMenuItem
            disabled={!isContributionEnabled(contribution, context)}
            key={getMenuContributionKey(contribution)}
            onClick={() =>
              void refreshMenuState(() =>
                platform.commands.execute(contribution.command, undefined),
              )
            }
          >
            {getMenuContributionLabel(contribution)}
          </ContextMenuItem>
        );
      })}
    </>
  );
}

function PlatformMenuButton<TContext = unknown>({
  contribution,
  context,
  className,
}: {
  contribution: MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>;
  context: TContext;
  className?: string;
}) {
  const { platform } = usePlatform<TContext>();
  const refreshMenuState = useMenuStateRefresh();

  if (contribution.kind === "submenu") {
    return (
      <Button className={className} disabled role="menuitem" type="button" variant="ghost">
        {getMenuContributionLabel(contribution)}
      </Button>
    );
  }

  const commandContribution = contribution as
    | MenuCommandContribution<string, CommandDefinition<unknown, unknown>, TContext>
    | MenuToggleContribution<string, CommandDefinition<unknown, unknown>, TContext>;

  return (
    <Button
      className={className}
      data-platform-menu-item={commandContribution.command.id}
      disabled={!isContributionEnabled(commandContribution, context)}
      onClick={() =>
        void refreshMenuState(() =>
          platform.commands.execute(commandContribution.command, undefined),
        )
      }
      role="menuitem"
      type="button"
      variant="ghost"
    >
      {getMenuContributionLabel(commandContribution)}
    </Button>
  );
}

function useMenuStateRefresh() {
  const [, refresh] = React.useReducer((value: number) => value + 1, 0);

  return React.useCallback(async (execute: () => Promise<unknown>) => {
    try {
      await execute();
    } finally {
      refresh();
    }
  }, []);
}
