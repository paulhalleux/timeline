import React from "react";

import {
  addCue,
  type CueInput,
  fixOverlaps,
  generateCueId,
} from "@ptl/subtitle";

import { useSubtitleEditor } from "../react.tsx";

export const useAddNewCue = () => {
  const editor = useSubtitleEditor();
  return React.useCallback(
    (init: CueInput) => {
      const document = editor.getActiveDocument();
      if (!document) return;
      const cueToAdd = {
        id: generateCueId(),
        ...init,
      };

      editor.addDocument(
        fixOverlaps(addCue(document, cueToAdd), "trim", [cueToAdd.id]),
      );
    },
    [editor],
  );
};
