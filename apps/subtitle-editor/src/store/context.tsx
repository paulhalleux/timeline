import * as React from "react";
import { Store } from "@ptl/store";
import type { Timeline } from "@ptl/timeline-core";
import {
  createInitialState,
  type SubtitleEditorState,
} from "../types";
import { createEditorActions, type EditorActions } from "./actions";

/**
 * Subtitle Editor Context interface.
 * Provides access to state and actions for subtitle editing.
 */
export interface SubtitleEditorContextValue {
  /** Reactive store containing editor state */
  store: Store<SubtitleEditorState>;
  /** Get current state snapshot */
  getState: () => SubtitleEditorState;
  /** Editor actions */
  actions: EditorActions;
}

/**
 * Creates a new subtitle editor instance.
 */
export const createSubtitleEditor = (
  timeline: Timeline
): SubtitleEditorContextValue => {
  const store = new Store<SubtitleEditorState>(createInitialState());
  const actions = createEditorActions(store, timeline);

  return {
    store,
    getState: () => store.get(),
    actions,
  };
};

const SubtitleEditorContext = React.createContext<SubtitleEditorContextValue | null>(null);

/**
 * Provider component for subtitle editor context.
 */
export const SubtitleEditorProvider: React.FC<{
  timeline: Timeline;
  children: React.ReactNode;
}> = ({ timeline, children }) => {
  const [editor] = React.useState(() => createSubtitleEditor(timeline));

  React.useEffect(() => {
    return () => {
      editor.actions.destroy();
    };
  }, [editor]);

  return (
    <SubtitleEditorContext.Provider value={editor}>
      {children}
    </SubtitleEditorContext.Provider>
  );
};

/**
 * Hook to access the subtitle editor context.
 * @throws Error if used outside of SubtitleEditorProvider
 */
export const useSubtitleEditor = (): SubtitleEditorContextValue => {
  const context = React.useContext(SubtitleEditorContext);
  if (!context) {
    throw new Error(
      "useSubtitleEditor must be used within a SubtitleEditorProvider"
    );
  }
  return context;
};

/**
 * Hook to access editor actions directly.
 */
export const useEditorActions = (): EditorActions => {
  return useSubtitleEditor().actions;
};
