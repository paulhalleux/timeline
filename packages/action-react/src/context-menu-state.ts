export interface ActionContextMenuState {
  open: boolean;
  x: number;
  y: number;
  event?: MouseEvent;
  target?: EventTarget | null;
  scopeElementId?: string;
}

export const closedActionContextMenuState: ActionContextMenuState = {
  open: false,
  x: 0,
  y: 0,
};
