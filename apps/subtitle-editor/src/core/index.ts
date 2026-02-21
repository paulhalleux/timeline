import { Store } from "@ptl/store";
import type { SubtitleDocument } from "@ptl/subtitle";

export type SubtitleEditorState = {
  document: SubtitleDocument | null;
};

export type SubtitleEditorApi = {
  store: Store<SubtitleEditorState>;
  setDocument: (document: SubtitleDocument) => void;
  clearDocument: () => void;
};

export const createSubtitleEditor = (): SubtitleEditorApi => {
  const store = new Store<SubtitleEditorState>({
    document: null,
  });

  const setDocument = (document: SubtitleDocument) => {
    store.set({ document });
  };

  const clearDocument = () => {
    store.set({ document: null });
  };

  return {
    store,
    setDocument,
    clearDocument,
  };
};
