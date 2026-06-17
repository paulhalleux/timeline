export interface EditorLayoutPreset {
  readonly id: string;
  readonly workspace: readonly { readonly editorId: string; readonly active?: boolean }[];
  readonly tools: Readonly<Record<string, { readonly placement: string; readonly visible: boolean }>>;
}

export function createLayoutPreset<const TPreset extends EditorLayoutPreset>(preset: TPreset): TPreset {
  return preset;
}

export const defaultEditorLayout = createLayoutPreset({
  id: "subtitle-editor.default",
  workspace: [{ editorId: "subtitle-document", active: true }],
  tools: {
    outline: { placement: "left-top", visible: true },
    tracks: { placement: "left-bottom", visible: true },
    inspector: { placement: "right-top", visible: true },
    "quality-control": { placement: "right-bottom", visible: true },
    playback: { placement: "bottom-right", visible: true },
    timeline: { placement: "bottom-left", visible: true },
    export: { placement: "right-bottom", visible: true },
  },
});
