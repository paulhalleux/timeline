import { useStoreSelector } from "@ptl/store/react";
import type { SubtitleDocument } from "@ptl/subtitle";
import React from "react";

import type { SubtitleEditorApi } from "./index.ts";

export type SubtitleEditorContextType = SubtitleEditorApi;
const SubtitleEditorContext =
  React.createContext<SubtitleEditorContextType | null>(null);

export const SubtitleEditorProvider: React.FC<
  React.PropsWithChildren<{ api: SubtitleEditorContextType }>
> = ({ api, children }) => {
  return (
    <SubtitleEditorContext.Provider value={api}>
      {children}
    </SubtitleEditorContext.Provider>
  );
};

export const useSubtitleEditor = () => {
  const context = React.useContext(SubtitleEditorContext);
  if (!context) {
    throw new Error(
      "useSubtitleEditor must be used within a SubtitleEditorProvider",
    );
  }
  return context;
};

export const useSubtitleDocument = <T,>(
  selector: (state: SubtitleDocument | null) => T,
) => {
  const editor = useSubtitleEditor();
  return useStoreSelector(editor.store, () => {
    return selector(editor.getActiveDocument());
  });
};

export const useDocumentList = () => {
  const editor = useSubtitleEditor();
  return useStoreSelector(editor.store, () => {
    return editor.getDocumentList();
  });
};

export const useSelectedCueIds = () => {
  const editor = useSubtitleEditor();
  return useStoreSelector(editor.store, () => {
    return editor.getSelectedCueIds();
  });
};

export const useIsCueSelected = (cueId: string) => {
  const editor = useSubtitleEditor();
  return useStoreSelector(editor.store, () => {
    return editor.isCueSelected(cueId);
  });
};
