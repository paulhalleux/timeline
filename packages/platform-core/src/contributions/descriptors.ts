import type { CommandDefinition } from "../commands/create-command";
import type { LocalizedText } from "../text/messages";
import type { ContributionStatePredicate } from "./when";

export interface MenuContributionBase<TMenuId extends string = string, TContext = unknown>
  extends ContributionStatePredicate<TContext> {
  readonly menu: TMenuId;
  readonly id?: string;
  readonly label?: LocalizedText;
  readonly group?: string;
  readonly order?: number;
}

export interface MenuCommandContribution<
  TMenuId extends string = string,
  TCommand extends CommandDefinition<unknown, unknown> = CommandDefinition<unknown, unknown>,
  TContext = unknown,
> extends MenuContributionBase<TMenuId, TContext> {
  readonly kind?: "command";
  readonly command: TCommand;
}

export interface MenuToggleContribution<
  TMenuId extends string = string,
  TCommand extends CommandDefinition<unknown, unknown> = CommandDefinition<unknown, unknown>,
  TContext = unknown,
> extends MenuContributionBase<TMenuId, TContext> {
  readonly kind: "toggle";
  readonly command: TCommand;
  readonly checked?: (context: TContext) => boolean;
}

export interface MenuSubmenuContribution<TMenuId extends string = string, TContext = unknown>
  extends MenuContributionBase<TMenuId, TContext> {
  readonly kind: "submenu";
  readonly submenu: TMenuId;
}

export type MenuContribution<
  TMenuId extends string = string,
  TCommand extends CommandDefinition<unknown, unknown> = CommandDefinition<unknown, unknown>,
  TContext = unknown,
> =
  | MenuCommandContribution<TMenuId, TCommand, TContext>
  | MenuToggleContribution<TMenuId, TCommand, TContext>
  | MenuSubmenuContribution<TMenuId, TContext>;

export interface MenuRootContribution<TMenuId extends string = string, TContext = unknown>
  extends ContributionStatePredicate<TContext> {
  readonly menu: TMenuId;
  readonly label: LocalizedText;
  readonly order?: number;
}

export interface ShortcutContribution<
  TCommand extends CommandDefinition<unknown, unknown> = CommandDefinition<unknown, unknown>,
  TContext = unknown,
> extends ContributionStatePredicate<TContext> {
  readonly command: TCommand;
  readonly shortcut: string;
  readonly preventDefault?: boolean;
  readonly source?: string;
}

export interface ToolbarContribution<
  TToolbarId extends string = string,
  TCommand extends CommandDefinition<unknown, unknown> = CommandDefinition<unknown, unknown>,
  TContext = unknown,
> extends ContributionStatePredicate<TContext> {
  readonly toolbar: TToolbarId;
  readonly command: TCommand;
  readonly group?: string;
  readonly order?: number;
  readonly icon?: string;
}

export function createMenuItem<const TItem extends MenuContribution>(item: TItem): TItem {
  return item;
}

export function createMenuRoot<const TRoot extends MenuRootContribution>(root: TRoot): TRoot {
  return root;
}

export function createShortcut<const TShortcut extends ShortcutContribution>(shortcut: TShortcut): TShortcut {
  return shortcut;
}

export function createToolbarItem<const TToolbar extends ToolbarContribution>(item: TToolbar): TToolbar {
  return item;
}
