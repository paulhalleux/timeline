import { Store } from "@ptl/store";
import { getMetadataValue, type SubtitleDocument } from "@ptl/subtitle";
import { castDraft } from "immer";

export type SubtitleEditorState = {
  documents: Map<string, SubtitleDocument>;
  activeDocumentId: string | null;
};

export type SubtitleEditorApi = {
  // State management
  store: Store<SubtitleEditorState>;

  // Document list management
  getDocumentById: (id: string) => SubtitleDocument | undefined;
  getDocumentList: () => SubtitleDocument[];
  addDocument: (document: SubtitleDocument) => void;
  removeDocument: (id: string) => void;

  // Active document management
  setActiveDocument: (id: string | undefined) => void;
  getActiveDocument: () => SubtitleDocument | null;
};

export const createSubtitleEditor = (): SubtitleEditorApi => {
  const store = new Store<SubtitleEditorState>({
    documents: new Map(),
    activeDocumentId: null,
  });

  const getDocumentById = (id: string) => store.get().documents.get(id);
  const getDocumentList = () => Array.from(store.get().documents.values());
  const addDocument = (document: SubtitleDocument) => {
    store.update((state) => {
      const id = getMetadataValue<string>(document, "id");
      if (!id) {
        throw new Error("Document must have an 'id' metadata field.");
      }
      state.documents.set(id, castDraft(document));
    });
  };
  const removeDocument = (id: string) => {
    store.update((state) => {
      state.documents.delete(id);
      if (state.activeDocumentId === id) {
        state.activeDocumentId = null;
      }
    });
  };

  const setActiveDocument = (id: string | undefined) => {
    store.update((state) => {
      if (id === undefined) {
        state.activeDocumentId = null;
        return;
      }

      state.activeDocumentId = id;
    });
  };

  const getActiveDocument = () => {
    const activeId = store.get().activeDocumentId;
    console.log(activeId, store.get().documents);
    return activeId ? store.get().documents.get(activeId) || null : null;
  };

  return {
    store,

    getDocumentById,
    getDocumentList,
    addDocument,
    removeDocument,

    setActiveDocument,
    getActiveDocument,
  };
};
