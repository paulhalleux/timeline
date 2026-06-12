import type {
  FlexLayoutAction,
  FlexLayoutResult,
  FlexLayoutState,
  FlexPanelDefinition,
  FlexPanelId,
  FlexToolbarCorner,
} from "@ptl/flex-layout";
import React from "react";

/** Context passed to a composed panel renderer. */
export interface FlexRenderPanelContext<TMeta = unknown> {
  /** The active panel definition for the rendered panel area. */
  readonly panel: FlexPanelDefinition<TMeta>;
  /** Convenience alias for `panel.id`. */
  readonly panelId: FlexPanelId;
  /** Current immutable layout state. */
  readonly state: FlexLayoutState<TMeta>;
  /** Dispatches an action to the layout reducer/controller. */
  readonly dispatch: (action: FlexLayoutAction<TMeta>) => FlexLayoutResult<TMeta>;
  /** Hides the current panel when its constraints allow it. */
  readonly hide: () => FlexLayoutResult<TMeta>;
}

/** Context passed to a composed toolbar item renderer. */
export interface FlexRenderItemContext<TMeta = unknown> {
  /** The toolbar item/panel definition. */
  readonly panel: FlexPanelDefinition<TMeta>;
  /** Convenience alias for `panel.id`. */
  readonly panelId: FlexPanelId;
  /** The corner currently rendering the item. */
  readonly corner: FlexToolbarCorner;
  /** The group currently rendering the item, when it belongs to one. */
  readonly groupId?: string;
  /** The item's index inside its group, when known. */
  readonly index?: number;
  /** Whether this item points at the active panel. */
  readonly active: boolean;
  /** Whether the item is hidden. */
  readonly hidden: boolean;
  /** Current immutable layout state. */
  readonly state: FlexLayoutState<TMeta>;
  /** Dispatches an action to the layout reducer/controller. */
  readonly dispatch: (action: FlexLayoutAction<TMeta>) => FlexLayoutResult<TMeta>;
  /** Selects this item's panel. */
  readonly select: () => FlexLayoutResult<TMeta>;
  /** Hides this item/panel when constraints allow it. */
  readonly hide: () => FlexLayoutResult<TMeta>;
  /** Moves this toolbar item to another page corner. */
  readonly moveToCorner: (corner: FlexToolbarCorner) => FlexLayoutResult<TMeta>;
}

/** Context passed to a composed hidden-item renderer. */
export interface FlexRenderHiddenItemContext<TMeta = unknown> {
  /** The hidden panel definition. */
  readonly panel: FlexPanelDefinition<TMeta>;
  /** Convenience alias for `panel.id`. */
  readonly panelId: FlexPanelId;
  /** Current immutable layout state. */
  readonly state: FlexLayoutState<TMeta>;
  /** Dispatches an action to the layout reducer/controller. */
  readonly dispatch: (action: FlexLayoutAction<TMeta>) => FlexLayoutResult<TMeta>;
  /** Shows this hidden panel using the core package's default insertion behavior. */
  readonly show: () => FlexLayoutResult<TMeta>;
}

export type FlexPanelRenderer<TMeta = unknown> = (
  context: FlexRenderPanelContext<TMeta>,
) => React.ReactNode;

export type FlexToolbarItemRenderer<TMeta = unknown> = (
  context: FlexRenderItemContext<TMeta>,
) => React.ReactNode;

export type FlexHiddenItemRenderer<TMeta = unknown> = (
  context: FlexRenderHiddenItemContext<TMeta>,
) => React.ReactNode;

export interface FlexRenderers<TMeta = unknown> {
  readonly panel?: FlexPanelRenderer<TMeta>;
  readonly item?: FlexToolbarItemRenderer<TMeta>;
  readonly hiddenItem?: FlexHiddenItemRenderer<TMeta>;
}

export type FlexRendererSlot = keyof FlexRenderers;

export interface FlexLayoutContextValue<TMeta = unknown> {
  readonly state: FlexLayoutState<TMeta>;
  /** @deprecated Prefer `<FlexRender.Panel>{panel => ...}</FlexRender.Panel>`. */
  readonly renderPanel?: FlexPanelRenderer<TMeta>;
  /** @deprecated Prefer `<FlexRender.Item>{item => ...}</FlexRender.Item>`. */
  readonly renderToolbarItem?: FlexToolbarItemRenderer<TMeta>;
  readonly renderers: FlexRenderers<TMeta>;
  readonly registerRenderer: <TSlot extends FlexRendererSlot>(
    slot: TSlot,
    renderer: NonNullable<FlexRenderers<TMeta>[TSlot]>,
  ) => () => void;
  readonly dispatch: (action: FlexLayoutAction<TMeta>) => FlexLayoutResult<TMeta>;
  readonly draggedPanelId: FlexPanelId | null;
  readonly setDraggedPanelId: (panelId: FlexPanelId | null) => void;
}

export const FlexLayoutContext = React.createContext<FlexLayoutContextValue | null>(
  null,
);

/** Reads the layout context shared by all primitive components. */
export function useFlexLayoutContext<TMeta = unknown>(): FlexLayoutContextValue<TMeta> {
  const context = React.useContext(FlexLayoutContext);
  if (!context) {
    throw new Error("FlexLayout primitives must be rendered inside FlexLayout.Root");
  }
  return context as FlexLayoutContextValue<TMeta>;
}
