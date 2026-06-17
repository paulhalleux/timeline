import { isContributionVisible, type CommandDefinition, type MenuContribution, type MenuRootContribution } from "@ptl/platform-core";
import { formatCommandTitleSync } from "./format-command";
import { localizedTextToString } from "./text";

export function getVisibleMenuContributions<TContext>(
  contributions: readonly MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>[],
  menu: string,
  context: TContext,
) {
  return contributions
    .filter((contribution) => contribution.menu === menu)
    .filter((contribution) => isContributionVisible(contribution, context))
    .sort(compareMenuContribution);
}

export function groupMenuContributions<TContext>(
  contributions: readonly MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>[],
) {
  const groups = new Map<string, MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>[]>();
  for (const contribution of contributions) {
    const key = contribution.group ?? "default";
    groups.set(key, [...(groups.get(key) ?? []), contribution]);
  }

  return [...groups.values()];
}

export function getMenuChildren<TContext>(
  contributions: readonly MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>[],
  menu: string,
) {
  const prefix = `${menu}.`;
  return [
    ...new Set(
      contributions
        .map((contribution) => contribution.menu)
        .filter((id) => id.startsWith(prefix))
        .map((id) => id.slice(prefix.length).split(".")[0])
        .filter((id) => id.length > 0),
    ),
  ];
}

export interface ResolvedMenuRoot {
  menu: string;
  label: string;
  order: number;
}

export function getMenuRoots<TContext>(
  roots: readonly MenuRootContribution<string, TContext>[] | undefined,
  contributions: readonly MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>[],
  menu: string,
  context: TContext,
): ResolvedMenuRoot[] {
  const explicitRoots =
    roots
      ?.filter((root) => root.menu.startsWith(`${menu}.`))
      .filter((root) => isContributionVisible(root, context))
      .map((root) => ({
        menu: root.menu,
        label: localizedTextToString(root.label),
        order: root.order ?? 0,
      })) ?? [];

  const inferredRoots = getMenuChildren(contributions, menu).map((child, index) => ({
    menu: `${menu}.${child}`,
    label: titleFromMenuSegment(child),
    order: index,
  }));

  const byMenu = new Map<string, ResolvedMenuRoot>();
  for (const root of [...inferredRoots, ...explicitRoots]) {
    byMenu.set(root.menu, root);
  }

  return [...byMenu.values()].sort((a, b) => {
    const order = a.order - b.order;
    return order === 0 ? a.label.localeCompare(b.label) : order;
  });
}

export function getMenuContributionKey<TContext>(
  contribution: MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>,
): string {
  if (contribution.id) {
    return contribution.id;
  }

  if (contribution.kind === "submenu") {
    return `${contribution.menu}:${contribution.submenu}`;
  }

  return `${contribution.menu}:${contribution.command.id}`;
}

export function getMenuContributionLabel<TContext>(
  contribution: MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>,
): string {
  if (contribution.label) {
    return localizedTextToString(contribution.label);
  }

  if (contribution.kind === "submenu") {
    return titleFromMenuSegment(contribution.submenu.split(".").at(-1) ?? contribution.submenu);
  }

  return formatCommandTitleSync(contribution.command);
}

function compareMenuContribution<TContext>(
  a: MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>,
  b: MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>,
) {
  const order = (a.order ?? 0) - (b.order ?? 0);
  return order === 0
    ? getMenuContributionLabel(a).localeCompare(getMenuContributionLabel(b))
    : order;
}

function titleFromMenuSegment(segment: string): string {
  return segment.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
