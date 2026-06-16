import type { LocalizedText } from "@ptl/platform-core";
import type { EditorTimedTextDocument } from "@ptl/timed-text-core";

export type SubtitleChangeSource = "user" | "plugin" | "system";

export interface SubtitleDocumentChangeMetadata {
  label: LocalizedText;
  source: SubtitleChangeSource;
  pluginId?: string;
}

export interface SubtitleDocumentTransaction<
  TData = unknown,
> extends SubtitleDocumentChangeMetadata {
  documentId: string;
  before: EditorTimedTextDocument | undefined;
  after: EditorTimedTextDocument;
  data?: TData;
}

export interface SubtitleHistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export type TimedTextDocumentEvent =
  | { type: "document.opened"; document: EditorTimedTextDocument }
  | { type: "document.closed"; documentId: string }
  | ({ type: "history.changed" } & SubtitleHistoryState)
  | ({
      type: "document.changed";
      document: EditorTimedTextDocument;
    } & SubtitleDocumentChangeMetadata);
