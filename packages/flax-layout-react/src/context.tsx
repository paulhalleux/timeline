import type {
  FlaxLayoutAction,
  FlaxLayoutResult,
  FlaxLayoutState,
  FlaxPanelDefinition,
  FlaxPanelId,
  FlaxToolbarCorner,
} from "@ptl/flax-layout";
import React from "react";

/** Context passed to a composed panel renderer. */
export interface FlaxRenderPanelContext<TMeta = unknown> {
  /** The active panel definition for the rendered panel area. */
  readonly panel: FlaxPanelDefinition<TMeta>;
  /** Convenience alias for `panel.id`. */
  readonly panelId: FlaxPanelId;
  /** Current immutable layout state. */
  readonly state: FlaxLayoutState<TMeta>;
  /** Dispatches an action to the layout reducer/controller. */
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
  /** Hides the current panel when its constraints allow it. */
  readonly hide: () => FlaxLayoutResult<TMeta>;
}

/** Context passed to a composed toolbar item renderer. */
export interface FlaxRenderItemContext<TMeta = unknown> {
  /** The toolbar item/panel definition. */
  readonly panel: FlaxPanelDefinition<TMeta>;
  /** Convenience alias for `panel.id`. */
  readonly panelId: FlaxPanelId;
  /** The corner currently rendering the item. */
  readonly corner: FlaxToolbarCorner;
  /** The group currently rendering the item, when it belongs to one. */
  readonly groupId?: string;
  /** The item's index inside its group, when known. */
  readonly index?: number;
  /** Whether this item points at the active panel. */
  readonly active: boolean;
  /** Whether the item is hidden. */
  readonly hidden: boolean;
  /** Current immutable layout state. */
  readonly state: FlaxLayoutState<TMeta>;
  /** Dispatches an action to the layout reducer/controller. */
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
  /** Selects this item's panel. */
  readonly select: () => FlaxLayoutResult<TMeta>;
  /** Hides this item/panel when constraints allow it. */
  readonly hide: () => FlaxLayoutResult<TMeta>;
  /** Moves this toolbar item to another page corner. */
  readonly moveToCorner: (corner: FlaxToolbarCorner) => FlaxLayoutResult<TMeta>;
}

/** Context passed to a composed hidden-item renderer. */
export interface FlaxRenderHiddenItemContext<TMeta = unknown> {
  /** The hidden panel definition. */
  readonly panel: FlaxPanelDefinition<TMeta>;
  /** Convenience alias for `panel.id`. */
  readonly panelId: FlaxPanelId;
  /** Current immutable layout state. */
  readonly state: FlaxLayoutState<TMeta>;
  /** Dispatches an action to the layout reducer/controller. */
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
  /** Shows this hidden panel using the core package's default insertion behavior. */
  readonly show: () => FlaxLayoutResult<TMeta>;
}

export type FlaxPanelRenderer<TMeta = unknown> = (
  context: FlaxRenderPanelContext<TMeta>,
) => React.ReactNode;

export type FlaxToolbarItemRenderer<TMeta = unknown> = (
  context: FlaxRenderItemContext<TMeta>,
) => React.ReactNode;

export type FlaxHiddenItemRenderer<TMeta = unknown> = (
  context: FlaxRenderHiddenItemContext<TMeta>,
) => React.ReactNode;

export interface FlaxRenderers<TMeta = unknown> {
  readonly panel?: FlaxPanelRenderer<TMeta>;
  readonly item?: FlaxToolbarItemRenderer<TMeta>;
  readonly hiddenItem?: FlaxHiddenItemRenderer<TMeta>;
}

export type FlaxRendererSlot = keyof FlaxRenderers;

export interface FlaxLayoutContextValue<TMeta = unknown> {
  readonly state: FlaxLayoutState<TMeta>;
  /** @deprecated Prefer `<FlaxRender.Panel>{panel => ...}</FlaxRender.Panel>`. */
  readonly renderPanel?: FlaxPanelRenderer<TMeta>;
  /** @deprecated Prefer `<FlaxRender.Item>{item => ...}</FlaxRender.Item>`. */
  readonly renderToolbarItem?: FlaxToolbarItemRenderer<TMeta>;
  readonly renderers: FlaxRenderers<TMeta>;
  readonly registerRenderer: <TSlot extends FlaxRendererSlot>(
    slot: TSlot,
    renderer: NonNullable<FlaxRenderers<TMeta>[TSlot]>,
  ) => () => void;
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
  readonly draggedPanelId: FlaxPanelId | null;
  readonly setDraggedPanelId: (panelId: FlaxPanelId | null) => void;
}

export const FlaxLayoutContext = React.createContext<FlaxLayoutContextValue | null>(
  null,
);

/** Reads the layout context shared by all primitive components. */
export function useFlaxLayoutContext<TMeta = unknown>(): FlaxLayoutContextValue<TMeta> {
  const context = React.useContext(FlaxLayoutContext);
  if (!context) {
    throw new Error("FlaxLayout primitives must be rendered inside FlaxLayout.Root");
  }
  return context as FlaxLayoutContextValue<TMeta>;
}
