import type { ActionContext } from "@ptl/action-core";

import type { EditorTimedTextDocument } from "../editor-model";

/**
 * Optional selection service commonly used by cue-oriented timed-text actions.
 */
export interface TimedTextActionSelectionService {
  getCueIds(): readonly string[];
  getTrackId?(): string | undefined;
}

/**
 * Context required by built-in timed-text actions.
 *
 * Timed-text actions are regular @ptl/action-core actions with a domain-specific
 * context. They return pure operation results; the host decides whether to keep
 * those results in local state, history, collaboration, or persistence layers.
 */
export interface TimedTextActionContext extends ActionContext {
  getDocument(): EditorTimedTextDocument;
  selection?: TimedTextActionSelectionService;
  createId?: (prefix: string) => string;
}
