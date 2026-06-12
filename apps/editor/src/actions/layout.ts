import type { ActionDefinition, ActionPlacement } from "@ptl/actions";
import type { EditorActionServices } from "./services";

export interface PlacedAction {
  action: ActionDefinition<EditorActionServices>;
  placement: ActionPlacement;
}

export function getMenuActions(
  actions: ActionDefinition<EditorActionServices>[],
  menu: string,
): PlacedAction[] {
  return getPlacedActions(actions, (placement) => placement.menu === menu);
}

export function getToolbarActions(
  actions: ActionDefinition<EditorActionServices>[],
  toolbar: string,
): PlacedAction[] {
  return getPlacedActions(actions, (placement) => placement.toolbar === toolbar);
}

export function getPaletteActions(
  actions: ActionDefinition<EditorActionServices>[],
): PlacedAction[] {
  return actions
    .flatMap((action) => {
      const placement = action.descriptor.placement?.find((placement) => placement.palette);

      return placement ? [{ action, placement }] : [];
    })
    .sort((a, b) => (a.placement.order ?? 0) - (b.placement.order ?? 0));
}

export function groupPlacedActions(actions: PlacedAction[]): PlacedAction[][] {
  const groups = new Map<string, PlacedAction[]>();

  for (const action of actions) {
    const group = action.placement.group ?? "default";
    groups.set(group, [...(groups.get(group) ?? []), action]);
  }

  return Array.from(groups.values());
}

function getPlacedActions(
  actions: ActionDefinition<EditorActionServices>[],
  filter: (placement: ActionPlacement) => boolean,
): PlacedAction[] {
  return actions
    .flatMap((action) =>
      (action.descriptor.placement ?? []).filter(filter).map((placement) => ({
        action,
        placement,
      })),
    )
    .sort((a, b) => (a.placement.order ?? 0) - (b.placement.order ?? 0));
}
