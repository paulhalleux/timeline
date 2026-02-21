import { addCue, type CueInput } from "@ptl/subtitle";
import React from "react";

import { useSubtitleEditor } from "../react.tsx";

export const useAddNewCue = () => {
  const editor = useSubtitleEditor();
  return React.useCallback(
    (init: CueInput) => {
      const document = editor.getActiveDocument();
      if (!document) return;
      editor.addDocument(addCue(document, init));
    },
    [editor],
  );
};
