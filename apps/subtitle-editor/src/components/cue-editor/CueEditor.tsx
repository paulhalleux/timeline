import { TextIcon } from "lucide-react";
import React from "react";

import { useActiveTrackId, useSelection } from "../../core";
import { EmptyState } from "../ui/EmptyState/EmptyState.tsx";
import { MultipleCueEditor } from "./MultipleCueEditor.tsx";
import { SingleCueEditor } from "./SingleCueEditor.tsx";

export const CueEditor: React.FC = () => {
  const selection = useSelection();
  const activeTrackId = useActiveTrackId();

  // Get selected cues for active track
  const selectedCues = activeTrackId
    ? selection.selectedCues.get(activeTrackId)
    : null;
  const selectedIndices = selectedCues ? Array.from(selectedCues) : [];

  // No selection
  if (selectedIndices.length === 0) {
    return (
      <EmptyState
        icon={<TextIcon size={48} />}
        title="No Cue Selected"
        description="Select a cue from the subtitle list or timeline to edit its properties."
      />
    );
  }

  // Single selection
  if (selectedIndices.length === 1 && activeTrackId) {
    return (
      <SingleCueEditor trackId={activeTrackId} cueIndex={selectedIndices[0]} />
    );
  }

  // Multiple selection
  if (activeTrackId) {
    return (
      <MultipleCueEditor trackId={activeTrackId} cueIndices={selectedIndices} />
    );
  }

  return null;
};
