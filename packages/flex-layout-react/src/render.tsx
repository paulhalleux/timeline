import React from "react";
import type {
  FlexHiddenItemRenderer,
  FlexPanelRenderer,
  FlexToolbarItemRenderer,
} from "./context";
import { useFlexLayoutContext } from "./context";

export interface FlexRenderPanelProps<TMeta = unknown> {
  /** Render function for active panel content. Return any React tree. */
  readonly children: FlexPanelRenderer<TMeta>;
}

export interface FlexRenderItemProps<TMeta = unknown> {
  /** Render function for toolbar items. */
  readonly children: FlexToolbarItemRenderer<TMeta>;
}

export interface FlexRenderHiddenItemProps<TMeta = unknown> {
  /** Render function for items shown in hidden-item/overflow menus. */
  readonly children: FlexHiddenItemRenderer<TMeta>;
}

/**
 * Registers a panel content renderer through composition instead of a `renderPanel` prop.
 *
 * @example
 * ```tsx
 * <FlexRender.Panel>{({ panel }) => <Panel id={panel.id} />}</FlexRender.Panel>
 * ```
 */
function FlexRenderPanel<TMeta = unknown>({ children }: FlexRenderPanelProps<TMeta>) {
  const { registerRenderer } = useFlexLayoutContext<TMeta>();

  React.useEffect(
    () => registerRenderer("panel", children),
    [children, registerRenderer],
  );

  return null;
}

/**
 * Registers a toolbar item renderer through composition instead of a `renderToolbarItem` prop.
 */
function FlexRenderItem<TMeta = unknown>({ children }: FlexRenderItemProps<TMeta>) {
  const { registerRenderer } = useFlexLayoutContext<TMeta>();

  React.useEffect(
    () => registerRenderer("item", children),
    [children, registerRenderer],
  );

  return null;
}

/** Registers a renderer for hidden items in `HiddenPanels` and `ToolbarOverflow`. */
function FlexRenderHiddenItem<TMeta = unknown>({
  children,
}: FlexRenderHiddenItemProps<TMeta>) {
  const { registerRenderer } = useFlexLayoutContext<TMeta>();

  React.useEffect(
    () => registerRenderer("hiddenItem", children),
    [children, registerRenderer],
  );

  return null;
}

/** Composition-first render slots for the layout primitives. */
export const FlexRender = {
  Panel: FlexRenderPanel,
  Item: FlexRenderItem,
  HiddenItem: FlexRenderHiddenItem,
};
