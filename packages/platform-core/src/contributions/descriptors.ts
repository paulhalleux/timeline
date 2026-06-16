import type { CommandDefinition } from "../commands/command-registry";
import type { LocalizedText } from "../text/messages";
import type { MessageDescriptor } from "../text/messages";
import type { ContributionStatePredicate } from "./when";
import type { SettingDefinition } from "../settings/settings-registry";

/**
 * Static placement metadata for renderer adapters.
 *
 * Platform-core owns the shape of menu, shortcut, and toolbar descriptors, but
 * it does not bind DOM listeners or render UI. React, desktop, CLI, and test
 * adapters can all read the same contribution data and choose their own
 * presentation.
 *
 * @example
 * ```ts
 * const menuItem = {
 *   menu: "main.file",
 *   command: exportCommand,
 *   group: "Project",
 *   order: 20,
 * };
 * ```
 */
export interface MenuContributionBase<
  TMenuId extends string = string,
  TContext = unknown,
> extends ContributionStatePredicate<TContext> {
  menu: TMenuId;
  id?: string;
  label?: LocalizedText;
  group?: string;
  order?: number;
}

export interface MenuCommandContribution<
  TMenuId extends string = string,
  TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>,
  TContext = unknown,
> extends MenuContributionBase<TMenuId, TContext> {
  kind?: "command";
  command: TCommand;
}

export interface MenuToggleContribution<
  TMenuId extends string = string,
  TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>,
  TContext = unknown,
> extends MenuContributionBase<TMenuId, TContext> {
  kind: "toggle";
  command: TCommand;
  checked?: (context: TContext) => boolean;
}

export interface MenuSubmenuContribution<
  TMenuId extends string = string,
  TContext = unknown,
> extends MenuContributionBase<TMenuId, TContext> {
  kind: "submenu";
  submenu: TMenuId;
}

export type MenuContribution<
  TMenuId extends string = string,
  TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>,
  TContext = unknown,
> =
  | MenuCommandContribution<TMenuId, TCommand, TContext>
  | MenuToggleContribution<TMenuId, TCommand, TContext>
  | MenuSubmenuContribution<TMenuId, TContext>;

export interface MenuRootContribution<
  TMenuId extends string = string,
  TContext = unknown,
> extends ContributionStatePredicate<TContext> {
  menu: TMenuId;
  label: LocalizedText;
  order?: number;
}

export interface ShortcutContribution<
  TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>,
  TContext = unknown,
> extends ContributionStatePredicate<TContext> {
  command: TCommand;
  shortcut: string;
  preventDefault?: boolean;
  readonly source?: string;
}

export interface ToolbarContribution<
  TToolbarId extends string = string,
  TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>,
  TContext = unknown,
> extends ContributionStatePredicate<TContext> {
  toolbar: TToolbarId;
  command: TCommand;
  group?: string;
  order?: number;
  icon?: string;
}

export interface PlatformContributions<TContext = unknown> {
  commands?: readonly CommandDefinition<any, any>[];
  menuRoots?: readonly MenuRootContribution<string, TContext>[];
  menus?: readonly MenuContribution<string, CommandDefinition<any, any>, TContext>[];
  shortcuts?: readonly ShortcutContribution<CommandDefinition<any, any>, TContext>[];
  toolbars?: readonly ToolbarContribution<string, CommandDefinition<any, any>, TContext>[];
  settings?: readonly SettingDefinition<any>[];
  messages?: readonly MessageDescriptor<any>[];
}
