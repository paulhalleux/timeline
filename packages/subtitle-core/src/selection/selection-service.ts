import { createEventEmitter, type Disposable } from "@ptl/platform-core";
import { Store } from "@ptl/store";

export type SubtitleSelection =
  | { kind: "none" }
  | {
      kind: "cue";
      trackId: string;
      cueIds: readonly string[];
      primaryCueId?: string;
    }
  | { kind: "range"; trackId: string; startMs: number; endMs: number };

export interface SubtitleSelectionService {
  getStore(): Store<SubtitleSelection>;
  getSelection(): SubtitleSelection;
  setSelection(selection: SubtitleSelection): void;
  clear(): void;
  subscribe(listener: (selection: SubtitleSelection) => void): Disposable;
}

interface SubtitleSelectionEvents {
  changed: SubtitleSelection;
}

/**
 * In-memory subtitle selection service shared by editor surfaces.
 *
 * Selection is deliberately separate from document state. Commands, menus,
 * shortcuts, timeline, and inspector panes can all observe the same
 * serializable selection without mutating `EditorTimedTextDocument`.
 *
 * @example
 * ```ts
 * const selection = new DefaultSubtitleSelectionService();
 * selection.setSelection({ kind: "cue", trackId: "subtitles", cueIds: ["cue-1"] });
 * ```
 */
export class DefaultSubtitleSelectionService implements SubtitleSelectionService {
  private readonly events = createEventEmitter<SubtitleSelectionEvents>();
  private readonly store = new Store<SubtitleSelection>({ kind: "none" });

  getStore(): Store<SubtitleSelection> {
    return this.store;
  }

  getSelection(): SubtitleSelection {
    return this.store.get();
  }

  setSelection(selection: SubtitleSelection): void {
    const next = normalizeSelection(selection);

    if (isSameSelection(this.getSelection(), next)) {
      return;
    }

    this.store.set(next);
    this.events.emit("changed", next);
  }

  clear(): void {
    this.setSelection({ kind: "none" });
  }

  subscribe(listener: (selection: SubtitleSelection) => void): Disposable {
    return this.events.on("changed", listener);
  }
}

export function getSelectedCueIds(selection: SubtitleSelection): readonly string[] {
  return selection.kind === "cue" ? selection.cueIds : [];
}

export function getSelectedTrackId(selection: SubtitleSelection): string | undefined {
  return selection.kind === "cue" || selection.kind === "range" ? selection.trackId : undefined;
}

export function hasCueSelection(selection: SubtitleSelection): boolean {
  return selection.kind === "cue" && selection.cueIds.length > 0;
}

export function hasSingleCueSelection(selection: SubtitleSelection): boolean {
  return selection.kind === "cue" && selection.cueIds.length === 1;
}

function normalizeSelection(selection: SubtitleSelection): SubtitleSelection {
  switch (selection.kind) {
    case "none":
      return { kind: "none" };
    case "cue": {
      const cueIds = [...new Set(selection.cueIds)];

      if (cueIds.length === 0) {
        return { kind: "none" };
      }

      return {
        kind: "cue",
        trackId: selection.trackId,
        cueIds,
        primaryCueId: cueIds.includes(selection.primaryCueId ?? "")
          ? selection.primaryCueId
          : cueIds[0],
      };
    }
    case "range": {
      const startMs = Math.min(selection.startMs, selection.endMs);
      const endMs = Math.max(selection.startMs, selection.endMs);
      return { ...selection, startMs, endMs };
    }
  }
}

function isSameSelection(previous: SubtitleSelection, next: SubtitleSelection) {
  return JSON.stringify(previous) === JSON.stringify(next);
}
