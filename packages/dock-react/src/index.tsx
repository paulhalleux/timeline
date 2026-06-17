export { DockLayout, type DockLayoutProps } from "./components/dock-layout";
export {
  DockDragDropContext,
  type DockDragDropContextProps,
} from "./components/dock-drag-drop-context";
export {
  DockResolvedLayout,
  type DockResolvedLayoutProps,
  type DockToolWindowComponentProps,
  type DockToolWindowHeaderComponentProps,
  type DockWorkspaceItemComponentProps,
} from "./components/dock-resolved-layout";
export {
  DockProvider,
  useDock,
  useDockState,
  type DockProviderProps,
} from "./provider/dock-provider";
import type React from "react";
import type { DockedPlacement, ToolDefinition } from "@ptl/dock-core";
export { createTool } from "@ptl/dock-core";

export interface ToolPanelProps<TState = unknown> {
  readonly toolId: string;
  readonly instanceId: string;
  readonly state: TState;
  updateState(update: TState | ((current: TState) => TState)): void;
  readonly active: boolean;
  readonly visible: boolean;
  readonly actions: {
    close(): void;
    hide(): void;
    focus(): void;
    move(placement: DockedPlacement): void;
  };
}

export interface ToolHeaderProps<TState = unknown> extends ToolPanelProps<TState> {}

export type ReactToolDefinition<TState = unknown> = ToolDefinition<
  React.ComponentType<ToolPanelProps<TState>>,
  TState,
  React.ComponentType<ToolHeaderProps<TState>>
>;
