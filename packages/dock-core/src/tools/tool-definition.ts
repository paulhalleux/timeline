import type { LocalizedText } from "@ptl/platform-core";
import type { DockedPlacement } from "../layout-state";

export interface ToolConstraints {
  readonly canHide?: boolean;
  readonly canMove?: boolean;
  readonly minWidth?: number;
  readonly minHeight?: number;
}

export interface ToolDefinition<TPanel, TState = unknown, THeader = TPanel> {
  readonly id: string;
  readonly title: LocalizedText;
  readonly icon?: unknown;
  readonly panel: TPanel;
  readonly header?: THeader;
  readonly preferredPlacement?: DockedPlacement;
  readonly constraints?: ToolConstraints;
  readonly initialState?: TState | (() => TState);
  readonly singleton?: boolean;
}

export interface ToolInstanceState<TState = unknown> {
  readonly id: string;
  readonly instanceId: string;
  readonly placement: DockedPlacement;
  readonly visible: boolean;
  readonly active?: boolean;
  readonly size?: number;
  readonly state?: TState;
}

export function createTool<const TTool extends ToolDefinition<unknown, unknown, unknown>>(
  definition: TTool,
): TTool {
  return definition;
}
