import type { LocalizedText } from "@ptl/platform-core";

export interface WorkspaceEditorDefinition<TPanel, TResource = unknown, TState = unknown> {
  readonly id: string;
  readonly resourceType?: unknown;
  readonly panel: TPanel;
  getTitle?(context: { readonly resource: TResource }): LocalizedText;
  readonly allowMultiple?: boolean;
  readonly initialState?: TState | (() => TState);
}

export interface WorkspaceEditorInstanceState<TState = unknown> {
  readonly instanceId: string;
  readonly editorId: string;
  readonly resourceId?: string;
  readonly active?: boolean;
  readonly state?: TState;
}

export function createWorkspaceEditor<
  const TEditor extends WorkspaceEditorDefinition<unknown, unknown, unknown>,
>(definition: TEditor): TEditor {
  return definition;
}
