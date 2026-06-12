export interface EditorActionServices {
  addActivity(message: string): void;
  getInspectorOpen(): boolean;
  setInspectorOpen(open: boolean): void;
  setCommandPaletteOpen(open: boolean): void;
}

export interface EditorActivityEntry {
  id: number;
  message: string;
}
