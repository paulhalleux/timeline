import {
  PlatformError,
  TypedEventEmitter,
  type Disposable,
  type LocalizedText,
} from "@ptl/platform-core";
import { Store } from "@ptl/store";
import type {
  EditorOperationError,
  EditorOperationResult,
  EditorTimedTextDocument,
} from "@ptl/timed-text-core";

import { subtitleErrorCodes } from "../errors";
import type {
  SubtitleChangeSource,
  SubtitleHistoryState,
  SubtitleDocumentTransaction,
  TimedTextDocumentEvent,
} from "./events";

export interface CommitOperationResultInput<TData> {
  label: LocalizedText;
  result: EditorOperationResult<TData>;
  source?: SubtitleChangeSource;
  pluginId?: string;
}

export interface ReplaceDocumentInput {
  label: LocalizedText;
  document: EditorTimedTextDocument;
  source?: SubtitleChangeSource;
  pluginId?: string;
  data?: unknown;
}

interface TimedTextDocumentEvents {
  event: TimedTextDocumentEvent;
}

/**
 * Stores timed-text editor documents and commits pure operation results.
 *
 * `subtitle-core` deliberately reuses `EditorTimedTextDocument` from
 * `@ptl/timed-text-core`; it does not introduce a duplicate subtitle model.
 *
 * @example
 * ```ts
 * const service = new TimedTextDocumentService();
 * service.open(createEditorDocument({ format: "vtt" }));
 * service.subscribe(event => console.log(event.type));
 * ```
 */
export class TimedTextDocumentService {
  private readonly documents = new Map<string, EditorTimedTextDocument>();
  private readonly transactions: SubtitleDocumentTransaction[] = [];
  private readonly redoTransactions: SubtitleDocumentTransaction[] = [];
  private readonly events = new TypedEventEmitter<TimedTextDocumentEvents>();
  private readonly currentDocumentStore = new Store<EditorTimedTextDocument | undefined>(
    undefined,
  );
  private readonly historyStore = new Store<SubtitleHistoryState>({
    canUndo: false,
    canRedo: false,
  });
  private historyState: SubtitleHistoryState = { canUndo: false, canRedo: false };
  private currentDocumentId: string | undefined;

  getDocumentStore(): Store<EditorTimedTextDocument | undefined> {
    return this.currentDocumentStore;
  }

  getHistoryStore(): Store<SubtitleHistoryState> {
    return this.historyStore;
  }

  getCurrent(): EditorTimedTextDocument | undefined {
    return this.currentDocumentId ? this.documents.get(this.currentDocumentId) : undefined;
  }

  getCurrentOrThrow(): EditorTimedTextDocument {
    const document = this.getCurrent();

    if (!document) {
      throw new PlatformError({
        code: subtitleErrorCodes.documentMissing,
        message: "No timed-text document is currently open.",
      });
    }

    return document;
  }

  getById(id: string): EditorTimedTextDocument | undefined {
    return this.documents.get(id);
  }

  getTransactions(): readonly SubtitleDocumentTransaction[] {
    return this.transactions;
  }

  getHistoryState(): SubtitleHistoryState {
    const next = {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };

    if (next.canUndo === this.historyState.canUndo && next.canRedo === this.historyState.canRedo) {
      return this.historyState;
    }

    this.historyState = next;
    return this.historyState;
  }

  canUndo(): boolean {
    return this.transactions.some((transaction) => transaction.before);
  }

  canRedo(): boolean {
    return this.redoTransactions.length > 0;
  }

  open(document: EditorTimedTextDocument): void {
    this.documents.set(document.id, document);
    this.currentDocumentId = document.id;
    this.currentDocumentStore.set(document);
    this.events.emit("event", { type: "document.opened", document });
  }

  close(documentId: string): void {
    this.documents.delete(documentId);
    if (this.currentDocumentId === documentId) {
      this.currentDocumentId = this.documents.keys().next().value;
    }
    this.currentDocumentStore.set(this.getCurrent());
    this.events.emit("event", { type: "document.closed", documentId });
  }

  commitOperationResult<TData>({
    label,
    result,
    source = "user",
    pluginId,
  }: CommitOperationResultInput<TData>): TData {
    if (!result.ok) {
      throw operationFailureToPlatformError(result.errors);
    }

    this.replaceDocument({
      label,
      document: result.document,
      source,
      pluginId,
      data: result.data,
    });

    return result.data;
  }

  replaceDocument({
    label,
    document,
    source = "user",
    pluginId,
    data,
  }: ReplaceDocumentInput): void {
    const before = this.documents.get(document.id);

    this.documents.set(document.id, document);
    this.currentDocumentId = document.id;
    this.currentDocumentStore.set(document);
    this.transactions.push({
      documentId: document.id,
      before,
      after: document,
      label,
      source,
      pluginId,
      data,
    });
    this.redoTransactions.length = 0;
    this.events.emit("event", {
      type: "document.changed",
      document,
      label,
      source,
      pluginId,
    });
    this.emitHistoryChanged();
  }

  undo(label: LocalizedText = "Undo"): SubtitleDocumentTransaction {
    const transaction = this.transactions.pop();

    if (!transaction?.before) {
      throw new PlatformError({
        code: subtitleErrorCodes.historyUnavailable,
        message: "There is no subtitle transaction to undo.",
      });
    }

    this.documents.set(transaction.documentId, transaction.before);
    this.currentDocumentId = transaction.documentId;
    this.currentDocumentStore.set(transaction.before);
    this.redoTransactions.push(transaction);
    this.events.emit("event", {
      type: "document.changed",
      document: transaction.before,
      label,
      source: "user",
    });
    this.emitHistoryChanged();

    return transaction;
  }

  redo(label: LocalizedText = "Redo"): SubtitleDocumentTransaction {
    const transaction = this.redoTransactions.pop();

    if (!transaction) {
      throw new PlatformError({
        code: subtitleErrorCodes.historyUnavailable,
        message: "There is no subtitle transaction to redo.",
      });
    }

    this.documents.set(transaction.documentId, transaction.after);
    this.currentDocumentId = transaction.documentId;
    this.currentDocumentStore.set(transaction.after);
    this.transactions.push(transaction);
    this.events.emit("event", {
      type: "document.changed",
      document: transaction.after,
      label,
      source: "user",
    });
    this.emitHistoryChanged();

    return transaction;
  }

  subscribe(listener: (event: TimedTextDocumentEvent) => void): Disposable {
    return this.events.on("event", listener);
  }

  private emitHistoryChanged(): void {
    this.historyStore.set(this.getHistoryState());
    this.events.emit("event", {
      type: "history.changed",
      ...this.getHistoryState(),
    });
  }
}

function operationFailureToPlatformError(errors: readonly EditorOperationError[]) {
  const first = errors[0];

  return new PlatformError({
    code: subtitleErrorCodes.operationFailed,
    message: first?.message ?? "Timed-text operation failed.",
    details: {
      errors,
      operationCode: first?.code,
      cueId: first?.cueId,
      trackId: first?.trackId,
    },
  });
}
