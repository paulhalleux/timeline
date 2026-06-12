import React from "react";
import type {
  FlaxHiddenItemRenderer,
  FlaxPanelRenderer,
  FlaxToolbarItemRenderer,
} from "./context";
import { useFlaxLayoutContext } from "./context";

export interface FlaxRenderPanelProps<TMeta = unknown> {
  /** Render function for active panel content. Return any React tree. */
  readonly children: FlaxPanelRenderer<TMeta>;
}

export interface FlaxRenderItemProps<TMeta = unknown> {
  /** Render function for toolbar items. */
  readonly children: FlaxToolbarItemRenderer<TMeta>;
}

export interface FlaxRenderHiddenItemProps<TMeta = unknown> {
  /** Render function for items shown in hidden-item/overflow menus. */
  readonly children: FlaxHiddenItemRenderer<TMeta>;
}

/**
 * Registers a panel content renderer through composition instead of a `renderPanel` prop.
 *
 * @example
 * ```tsx
 * <FlaxRender.Panel>{({ panel }) => <Panel id={panel.id} />}</FlaxRender.Panel>
 * ```
 */
function FlaxRenderPanel<TMeta = unknown>({ children }: FlaxRenderPanelProps<TMeta>) {
  const { registerRenderer } = useFlaxLayoutContext<TMeta>();

  React.useEffect(
    () => registerRenderer("panel", children),
    [children, registerRenderer],
  );

  return null;
}

/**
 * Registers a toolbar item renderer through composition instead of a `renderToolbarItem` prop.
 */
function FlaxRenderItem<TMeta = unknown>({ children }: FlaxRenderItemProps<TMeta>) {
  const { registerRenderer } = useFlaxLayoutContext<TMeta>();

  React.useEffect(
    () => registerRenderer("item", children),
    [children, registerRenderer],
  );

  return null;
}

/** Registers a renderer for hidden items in `HiddenPanels` and `ToolbarOverflow`. */
function FlaxRenderHiddenItem<TMeta = unknown>({
  children,
}: FlaxRenderHiddenItemProps<TMeta>) {
  const { registerRenderer } = useFlaxLayoutContext<TMeta>();

  React.useEffect(
    () => registerRenderer("hiddenItem", children),
    [children, registerRenderer],
  );

  return null;
}

/** Composition-first render slots for the layout primitives. */
export const FlaxRender = {
  Panel: FlaxRenderPanel,
  Item: FlaxRenderItem,
  HiddenItem: FlaxRenderHiddenItem,
};

/** Alias for consumers that prefer the “flex render” naming in JSX examples. */
export const FlexRender = FlaxRender;
