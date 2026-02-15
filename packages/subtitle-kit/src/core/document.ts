import { type Signal, WritableSignal } from "@ptl/signal";

import { type SupportedFormats } from "../formats/SubtitleParser";
import { type Timestamp } from "./timestamp";

export type SubtitleCue<Metadata extends Record<string, any>> = {
  /**
   * Unique identifier for the cue. Remains stable across reindexing operations.
   */
  id: string;
  /**
   * Sequential index of the cue in the document. May change during operations like remove, reindex, etc.
   */
  index: number;
  start: Timestamp;
  end: Timestamp;
  text: string;
  metadata?: Metadata;
};

/**
 * Options for splitting a cue.
 */
export type SplitOptions = {
  /**
   * The time at which to split the cue (in milliseconds).
   */
  splitTime: number;
  /**
   * How to distribute the text between the two resulting cues.
   * - 'first': All text goes to the first cue.
   * - 'second': All text goes to the second cue.
   * - 'both': Text is copied to both cues.
   * - 'split': Text is split at the midpoint (by sentences or words).
   * @default 'both'
   */
  textDistribution?: "first" | "second" | "both" | "split";
};

/**
 * Options for merging cues.
 */
export type MergeOptions = {
  /**
   * How to combine the text from merged cues.
   * - 'concat': Concatenate with newline.
   * - 'space': Concatenate with space.
   * - 'first': Keep only the first cue's text.
   * - 'second': Keep only the second cue's text.
   * @default 'concat'
   */
  textCombination?: "concat" | "space" | "first" | "second";
  /**
   * Custom separator for text combination.
   */
  separator?: string;
};

/**
 * Options for shifting cue timings.
 */
export type ShiftOptions = {
  /**
   * The offset in milliseconds to shift the cues.
   */
  offset: number;
  /**
   * Whether to prevent negative start times.
   * @default true
   */
  clampToZero?: boolean;
};

/**
 * Options for updating a cue with override behavior.
 */
export type UpdateWithOverrideOptions = {
  /**
   * How to handle overlapping cues.
   * - 'none': Don't modify overlapping cues.
   * - 'trim': Trim overlapping cues to avoid overlap.
   * - 'remove': Remove overlapping cues entirely.
   * @default 'none'
   */
  overlapBehavior?: "none" | "trim" | "remove";
};

/**
 * Represents a subtitle document containing multiple subtitle cues.
 *
 * Provides methods to access the cues, update them, and retrieve the format of the subtitle document.
 *
 * @template Format - The format of the subtitle document.
 * @template Metadata - The type of metadata associated with each subtitle cue.
 */
export class SubtitleDocument<
  Format extends SupportedFormats = SupportedFormats,
  Metadata extends Record<string, any> = Record<string, any>,
> {
  private readonly cues: WritableSignal<SubtitleCue<Metadata>[]>;

  private _startTime: number | null = null;
  private _endTime: number | null = null;
  private _cueByIndex: Map<number, SubtitleCue<Metadata>> | null = null;
  private _cueById: Map<string, SubtitleCue<Metadata>> | null = null;
  private _idCounter: number = 0;

  constructor(
    private readonly format: Format,
    cues: SubtitleCue<Metadata>[],
  ) {
    // Assign IDs to cues that don't have them and track the highest ID counter
    const cuesWithIds = cues.map((cue) => {
      if (!cue.id) {
        return { ...cue, id: this.generateId() };
      }
      // Extract numeric part from existing IDs to maintain counter
      const numMatch = cue.id.match(/^cue_(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num >= this._idCounter) {
          this._idCounter = num + 1;
        }
      }
      return cue;
    });
    this.cues = new WritableSignal(cuesWithIds);
    this.updateCache();
  }

  /**
   * Generate a unique ID for a cue.
   */
  private generateId(): string {
    return `cue_${this._idCounter++}`;
  }

  // Getters

  /**
   * Get the signal containing the cues of the subtitle document.
   * @returns The signal containing the cues of the subtitle document.
   */
  getCuesSignal(): Signal<SubtitleCue<Metadata>[]> {
    return this.cues;
  }

  /**
   * Get the cues of the subtitle document.
   * @returns The cues of the subtitle document.
   */
  getCues(): SubtitleCue<Metadata>[] {
    return this.cues.get();
  }

  /**
   * Get the format of the subtitle document.
   * @returns The format of the subtitle document.
   */
  getFormat(): Format {
    return this.format;
  }

  /**
   * Get the total duration of the subtitle document in milliseconds.
   * @returns The total duration in milliseconds.
   */
  getDuration(): number {
    return this.getEndTime() - this.getStartTime();
  }

  /**
   * Get the start time of the subtitle document in milliseconds.
   * @returns The start time in milliseconds.
   */
  getStartTime(): number {
    if (this._startTime === null) {
      this.updateCache();
    }

    return this._startTime ?? 0;
  }

  /**
   * Get the end time of the subtitle document in milliseconds.
   * @returns The end time in milliseconds.
   */
  getEndTime(): number {
    if (this._endTime === null) {
      this.updateCache();
    }

    return this._endTime ?? 0;
  }

  /**
   * Get the cues that are active at a specific time.
   * @param t - The time in milliseconds.
   * @returns The cues active at the specified time. If multiple cues are active, first one is returned.
   */
  getFirstAt(t: number): SubtitleCue<Metadata> | null {
    let low = 0;
    let high = this.cues.get().length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cue = this.cues.get()[mid];

      if (t < cue.start.milliseconds) {
        high = mid - 1;
      } else if (t > cue.end.milliseconds) {
        low = mid + 1;
      } else {
        return cue;
      }
    }

    return null;
  }

  /**
   * Get all cues that are active at a specific time.
   * @param t - The time in milliseconds.
   * @returns All cues active at the specified time.
   */
  getAllAt(t: number): SubtitleCue<Metadata>[] {
    return this.cues
      .get()
      .filter(
        (cue) => t >= cue.start.milliseconds && t <= cue.end.milliseconds,
      );
  }

  /**
   * Get all cues within a specific time range.
   * @param startTime - The start time in milliseconds.
   * @param endTime - The end time in milliseconds.
   * @param includePartial - Whether to include cues that partially overlap the range.
   * @returns The cues within the specified time range.
   */
  getCuesInRange(
    startTime: number,
    endTime: number,
    includePartial: boolean = true,
  ): SubtitleCue<Metadata>[] {
    return this.cues.get().filter((cue) => {
      if (includePartial) {
        return (
          cue.end.milliseconds >= startTime && cue.start.milliseconds <= endTime
        );
      }
      return (
        cue.start.milliseconds >= startTime && cue.end.milliseconds <= endTime
      );
    });
  }

  /**
   * Get all pairs of cues that overlap with each other.
   * @returns An array of tuples containing overlapping cue pairs.
   */
  getOverlappingCues(): [SubtitleCue<Metadata>, SubtitleCue<Metadata>][] {
    const overlaps: [SubtitleCue<Metadata>, SubtitleCue<Metadata>][] = [];
    const cuesList = this.cues.get();

    for (let i = 0; i < cuesList.length; i++) {
      for (let j = i + 1; j < cuesList.length; j++) {
        const cueA = cuesList[i];
        const cueB = cuesList[j];
        if (
          cueA.start.milliseconds < cueB.end.milliseconds &&
          cueA.end.milliseconds > cueB.start.milliseconds
        ) {
          overlaps.push([cueA, cueB]);
        }
      }
    }

    return overlaps;
  }

  /**
   * Get cues that overlap with a specific cue.
   * @param index - The index of the cue to check.
   * @returns The cues that overlap with the specified cue.
   */
  getCuesOverlappingWith(index: number): SubtitleCue<Metadata>[] {
    const targetCue = this.getCueByIndex(index);
    if (!targetCue) return [];

    return this.cues.get().filter((cue) => {
      if (cue.index === index) return false;
      return (
        cue.start.milliseconds < targetCue.end.milliseconds &&
        cue.end.milliseconds > targetCue.start.milliseconds
      );
    });
  }

  /**
   * Get a specific cue by its index.
   * @param index - The index of the cue to retrieve.
   * @returns The cue with the specified index, or null if not found.
   */
  getCueByIndex(index: number): SubtitleCue<Metadata> | null {
    if (this._cueByIndex === null) {
      this._cueByIndex = new Map();
      this.cues.get().forEach((cue) => {
        this._cueByIndex?.set(cue.index, cue);
      });
    }
    return this._cueByIndex.get(index) ?? null;
  }

  /**
   * Get a specific cue by its unique ID.
   * @param id - The unique ID of the cue to retrieve.
   * @returns The cue with the specified ID, or null if not found.
   */
  getCueById(id: string): SubtitleCue<Metadata> | null {
    if (this._cueById === null) {
      this._cueById = new Map();
      this.cues.get().forEach((cue) => {
        this._cueById?.set(cue.id, cue);
      });
    }
    return this._cueById.get(id) ?? null;
  }

  /**
   * Get the total number of cues in the document.
   * @returns The total number of cues.
   */
  getCueCount(): number {
    return this.cues.get().length;
  }

  // Setters

  /**
   * Update the cues of the subtitle document.
   * @param cues - The new cues to set.
   */
  setCues(cues: SubtitleCue<Metadata>[]): void {
    this.cues.set(cues);
    this.invalidateCache();
  }

  /**
   * Update a specific cue in the subtitle document.
   * @param index - The index of the cue to update.
   * @param newCue - The new cue data to set.
   */
  update(
    index: number,
    newCue: Partial<Omit<SubtitleCue<Metadata>, "index">>,
  ): void {
    const cue = this.cues.get().find((c) => c.index === index);
    if (!cue) return;
    const updatedCue = { ...cue, ...newCue, index };
    this.cues.set(
      this.cues.get().map((c) => (c.index === index ? updatedCue : c)),
    );
    this.invalidateCache();
  }

  /**
   * Update a cue with optional handling of overlapping cues.
   * @param index - The index of the cue to update.
   * @param newCue - The new cue data to set.
   * @param options - Options for handling overlaps.
   */
  updateWithOverride(
    index: number,
    newCue: Partial<Omit<SubtitleCue<Metadata>, "index">>,
    options: UpdateWithOverrideOptions = {},
  ): void {
    const { overlapBehavior = "none" } = options;

    // First, update the cue
    this.update(index, newCue);

    if (overlapBehavior === "none") return;

    const updatedCue = this.getCueByIndex(index);
    if (!updatedCue) return;

    const overlappingCues = this.getCuesOverlappingWith(index);

    if (overlapBehavior === "remove") {
      for (const overlappingCue of overlappingCues) {
        this.remove(overlappingCue.index);
      }
    } else if (overlapBehavior === "trim") {
      for (const overlappingCue of overlappingCues) {
        const trimmedCue = this.trimCueToAvoidOverlap(
          updatedCue,
          overlappingCue,
        );
        if (trimmedCue) {
          this.update(overlappingCue.index, trimmedCue);
        } else {
          // Cue would be completely covered, remove it
          this.remove(overlappingCue.index);
        }
      }
    }
  }

  /**
   * Remove a specific cue from the subtitle document.
   * @param index - The index of the cue to remove.
   */
  remove(index: number): void {
    this.cues.set(
      this.cues
        .get()
        .filter((c) => c.index !== index)
        .map((cue) => {
          if (cue.index > index) {
            return { ...cue, index: cue.index - 1 };
          }
          return cue;
        }),
    );
    this.invalidateCache();
  }

  /**
   * Remove multiple cues from the subtitle document.
   * @param indices - The indices of the cues to remove.
   */
  removeMany(indices: number[]): void {
    const sortedIndices = [...indices].sort((a, b) => b - a);
    for (const index of sortedIndices) {
      this.remove(index);
    }
  }

  /**
   * Insert a new cue into the subtitle document.
   * @param cue - The cue to insert.
   */
  insert(
    cue: Omit<SubtitleCue<Metadata>, "index" | "id"> & {
      index?: number;
      id?: string;
    },
  ): void {
    const newCues = structuredClone(this.cues.get());
    const newId = cue.id ?? this.generateId();

    if (
      cue.index !== undefined &&
      cue.index >= 0 &&
      cue.index <= newCues.length
    ) {
      newCues.forEach((c) => {
        if (cue.index && c.index >= cue.index) c.index = c.index + 1;
      });
      newCues.splice(cue.index - 1, 0, {
        ...cue,
        id: newId,
        index: cue.index,
      });
    } else {
      newCues.push({
        ...cue,
        id: newId,
        index: newCues.length,
      });
    }
    this.cues.set(newCues);
    this.invalidateCache();
  }

  /**
   * Split a cue at a specific time point into two separate cues.
   * @param index - The index of the cue to split.
   * @param options - Options for splitting the cue.
   * @returns True if the split was successful, false otherwise.
   */
  split(index: number, options: SplitOptions): boolean {
    const cue = this.getCueByIndex(index);
    if (!cue) return false;

    const { splitTime, textDistribution = "both" } = options;

    // Validate split time is within cue bounds
    if (
      splitTime <= cue.start.milliseconds ||
      splitTime >= cue.end.milliseconds
    ) {
      return false;
    }

    // Determine text distribution
    let firstText = cue.text;
    let secondText = cue.text;

    if (textDistribution === "first") {
      secondText = "";
    } else if (textDistribution === "second") {
      firstText = "";
    } else if (textDistribution === "split") {
      const midpoint = Math.floor(cue.text.length / 2);
      // Try to split at a word boundary
      const beforeMid = cue.text.lastIndexOf(" ", midpoint);
      const afterMid = cue.text.indexOf(" ", midpoint);
      const splitPoint =
        beforeMid !== -1 ? beforeMid : afterMid !== -1 ? afterMid : midpoint;
      firstText = cue.text.substring(0, splitPoint).trim();
      secondText = cue.text.substring(splitPoint).trim();
    }

    // Create the first cue (updates existing)
    const firstCue: Partial<Omit<SubtitleCue<Metadata>, "index">> = {
      start: cue.start,
      end: this.createTimestamp(splitTime),
      text: firstText,
      metadata: cue.metadata,
    };

    // Create the second cue
    const secondCue: Omit<SubtitleCue<Metadata>, "index" | "id"> = {
      start: this.createTimestamp(splitTime),
      end: cue.end,
      text: secondText,
      metadata: cue.metadata ? structuredClone(cue.metadata) : undefined,
    };

    // Update the first cue
    this.update(index, firstCue);

    // Insert the second cue after the first
    this.insert({ ...secondCue, index: index + 1 });

    return true;
  }

  /**
   * Duplicate a cue.
   * @param index - The index of the cue to duplicate.
   * @param insertAfter - Whether to insert the duplicate after the original. If false, inserts at the end.
   * @returns The index of the duplicated cue, or null if the cue was not found.
   */
  duplicate(index: number, insertAfter: boolean = true): number | null {
    const cue = this.getCueByIndex(index);
    if (!cue) return null;

    const duplicatedCue: Omit<SubtitleCue<Metadata>, "index" | "id"> = {
      start: structuredClone(cue.start),
      end: structuredClone(cue.end),
      text: cue.text,
      metadata: cue.metadata ? structuredClone(cue.metadata) : undefined,
    };

    if (insertAfter) {
      this.insert({ ...duplicatedCue, index: index + 1 });
      return index + 1;
    } else {
      const newIndex = this.cues.get().length;
      this.insert(duplicatedCue);
      return newIndex;
    }
  }

  /**
   * Merge two cues into one.
   * @param index1 - The index of the first cue.
   * @param index2 - The index of the second cue.
   * @param options - Options for merging the cues.
   * @returns True if the merge was successful, false otherwise.
   */
  merge(index1: number, index2: number, options: MergeOptions = {}): boolean {
    const cue1 = this.getCueByIndex(index1);
    const cue2 = this.getCueByIndex(index2);

    if (!cue1 || !cue2) return false;

    const { textCombination = "concat", separator } = options;

    // Determine the merged text
    let mergedText: string;
    switch (textCombination) {
      case "space":
        mergedText = `${cue1.text} ${cue2.text}`;
        break;
      case "first":
        mergedText = cue1.text;
        break;
      case "second":
        mergedText = cue2.text;
        break;
      case "concat":
      default:
        mergedText = separator
          ? `${cue1.text}${separator}${cue2.text}`
          : `${cue1.text}\n${cue2.text}`;
        break;
    }

    // Determine timing (earliest start to latest end)
    const startMs = Math.min(cue1.start.milliseconds, cue2.start.milliseconds);
    const endMs = Math.max(cue1.end.milliseconds, cue2.end.milliseconds);

    // Keep metadata from the first cue
    const mergedMetadata = cue1.metadata
      ? structuredClone(cue1.metadata)
      : cue2.metadata
        ? structuredClone(cue2.metadata)
        : undefined;

    // Update the first cue with merged data
    this.update(index1, {
      start: this.createTimestamp(startMs),
      end: this.createTimestamp(endMs),
      text: mergedText,
      metadata: mergedMetadata,
    });

    // Remove the second cue
    this.remove(index2);

    return true;
  }

  /**
   * Shift the timing of one or more cues by an offset.
   * @param indices - The indices of the cues to shift. If empty, shifts all cues.
   * @param options - Options for shifting the cues.
   */
  shift(indices: number[] | null, options: ShiftOptions): void {
    const { offset, clampToZero = true } = options;
    const targetIndices = indices ?? this.cues.get().map((c) => c.index);

    for (const index of targetIndices) {
      const cue = this.getCueByIndex(index);
      if (!cue) continue;

      let newStartMs = cue.start.milliseconds + offset;
      let newEndMs = cue.end.milliseconds + offset;

      if (clampToZero) {
        if (newStartMs < 0) {
          const adjustment = -newStartMs;
          newStartMs = 0;
          newEndMs = Math.max(0, newEndMs + adjustment);
        }
        newEndMs = Math.max(0, newEndMs);
      }

      this.update(index, {
        start: this.createTimestamp(newStartMs),
        end: this.createTimestamp(newEndMs),
      });
    }
  }

  /**
   * Scale the timing of all cues by a factor.
   * @param factor - The scaling factor (e.g., 1.5 for 50% slower, 0.5 for 50% faster).
   * @param anchor - The time anchor point for scaling. Default is 0 (start of document).
   */
  scale(factor: number, anchor: number = 0): void {
    if (factor <= 0) return;

    const cuesList = this.cues.get();
    for (const cue of cuesList) {
      const newStartMs = anchor + (cue.start.milliseconds - anchor) * factor;
      const newEndMs = anchor + (cue.end.milliseconds - anchor) * factor;

      this.update(cue.index, {
        start: this.createTimestamp(Math.max(0, newStartMs)),
        end: this.createTimestamp(Math.max(0, newEndMs)),
      });
    }
  }

  /**
   * Sort all cues by their start time.
   * @param reindexAfterSort - Whether to reindex cues after sorting. Default is true.
   */
  sortByTime(reindexAfterSort: boolean = true): void {
    const sortedCues = [...this.cues.get()].sort(
      (a, b) => a.start.milliseconds - b.start.milliseconds,
    );

    if (reindexAfterSort) {
      sortedCues.forEach((cue, idx) => {
        cue.index = idx;
      });
    }

    this.cues.set(sortedCues);
    this.invalidateCache();
  }

  /**
   * Reindex all cues sequentially starting from 0.
   */
  reindex(): void {
    const cuesList = this.cues.get().map((cue, idx) => ({
      ...cue,
      index: idx,
    }));
    this.cues.set(cuesList);
    this.invalidateCache();
  }

  /**
   * Clear all cues from the document.
   */
  clear(): void {
    this.cues.set([]);
    this.invalidateCache();
  }

  /**
   * Clone this document.
   * @returns A new SubtitleDocument with the same format and cues.
   */
  clone(): SubtitleDocument<Format, Metadata> {
    return new SubtitleDocument(this.format, structuredClone(this.cues.get()));
  }

  /**
   * Adjust the gap between cues to a specific duration.
   * @param gapMs - The desired gap in milliseconds between consecutive cues.
   * @param mode - How to adjust: 'extend' extends the previous cue, 'shift' shifts the next cue.
   */
  adjustGaps(gapMs: number, mode: "extend" | "shift" = "extend"): void {
    const sortedCues = [...this.cues.get()].sort(
      (a, b) => a.start.milliseconds - b.start.milliseconds,
    );

    for (let i = 1; i < sortedCues.length; i++) {
      const prevCue = sortedCues[i - 1];
      const currCue = sortedCues[i];
      const currentGap = currCue.start.milliseconds - prevCue.end.milliseconds;

      if (currentGap !== gapMs) {
        if (mode === "extend") {
          // Extend the previous cue's end time
          this.update(prevCue.index, {
            end: this.createTimestamp(currCue.start.milliseconds - gapMs),
          });
        } else {
          // Shift the current cue and all following cues
          const shiftAmount = gapMs - currentGap;
          for (let j = i; j < sortedCues.length; j++) {
            const cue = sortedCues[j];
            this.update(cue.index, {
              start: this.createTimestamp(cue.start.milliseconds + shiftAmount),
              end: this.createTimestamp(cue.end.milliseconds + shiftAmount),
            });
          }
        }
      }
    }
  }

  /**
   * Fix overlapping cues by trimming or removing them.
   * @param mode - 'trim' trims the overlapping portion, 'remove' removes the later cue.
   */
  fixOverlaps(mode: "trim" | "remove" = "trim"): void {
    const overlaps = this.getOverlappingCues();

    for (const [cueA, cueB] of overlaps) {
      // Determine which cue starts first
      const [first, second] =
        cueA.start.milliseconds <= cueB.start.milliseconds
          ? [cueA, cueB]
          : [cueB, cueA];

      if (mode === "remove") {
        this.remove(second.index);
      } else {
        // Trim the first cue to end when the second starts
        if (first.end.milliseconds > second.start.milliseconds) {
          this.update(first.index, {
            end: this.createTimestamp(second.start.milliseconds),
          });
        }
      }
    }
  }

  /**
   * Snap cue timings to the nearest frame boundary.
   * @param frameRate - The frame rate to snap to (e.g., 24, 25, 30).
   */
  snapToFrames(frameRate: number): void {
    const frameDuration = 1000 / frameRate;

    for (const cue of this.cues.get()) {
      const snappedStart =
        Math.round(cue.start.milliseconds / frameDuration) * frameDuration;
      const snappedEnd =
        Math.round(cue.end.milliseconds / frameDuration) * frameDuration;

      this.update(cue.index, {
        start: this.createTimestamp(snappedStart),
        end: this.createTimestamp(
          Math.max(snappedStart + frameDuration, snappedEnd),
        ),
      });
    }
  }

  // Private methods

  private invalidateCache(): void {
    this._startTime = null;
    this._endTime = null;
    this._cueByIndex = null;
    this._cueById = null;
  }

  private updateCache(): void {
    if (this.cues.get().length === 0) {
      this._startTime = 0;
      this._endTime = 0;
      return;
    }

    this._startTime = Math.min(
      ...this.cues.get().map((cue) => cue.start.milliseconds),
    );

    this._endTime = Math.max(
      ...this.cues.get().map((cue) => cue.end.milliseconds),
    );
  }

  /**
   * Create a timestamp from milliseconds.
   */
  private createTimestamp(milliseconds: number): Timestamp {
    return {
      milliseconds,
      raw: this.formatMillisecondsToRaw(milliseconds),
    };
  }

  /**
   * Format milliseconds to a raw timestamp string.
   */
  private formatMillisecondsToRaw(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0") +
      "," +
      String(milliseconds).padStart(3, "0")
    );
  }

  /**
   * Trim a cue to avoid overlap with a reference cue.
   */
  private trimCueToAvoidOverlap(
    referenceCue: SubtitleCue<Metadata>,
    cueToTrim: SubtitleCue<Metadata>,
  ): Partial<Omit<SubtitleCue<Metadata>, "index">> | null {
    const refStart = referenceCue.start.milliseconds;
    const refEnd = referenceCue.end.milliseconds;
    const trimStart = cueToTrim.start.milliseconds;
    const trimEnd = cueToTrim.end.milliseconds;

    // Cue is completely inside reference - remove it
    if (trimStart >= refStart && trimEnd <= refEnd) {
      return null;
    }

    // Reference is completely inside cue - split would be needed, just trim end
    if (refStart > trimStart && refEnd < trimEnd) {
      // Trim to before the reference starts
      return {
        end: this.createTimestamp(refStart),
      };
    }

    // Cue overlaps at the end of reference
    if (trimStart < refEnd && trimStart >= refStart) {
      return {
        start: this.createTimestamp(refEnd),
      };
    }

    // Cue overlaps at the start of reference
    if (trimEnd > refStart && trimEnd <= refEnd) {
      return {
        end: this.createTimestamp(refStart),
      };
    }

    return {};
  }

  static fromTextTrack<Metadata extends Record<string, any>>(
    format: SupportedFormats,
    textTrack: TextTrack,
  ): SubtitleDocument<typeof format, Metadata> {
    const cues: SubtitleCue<Metadata>[] = [];
    if (!textTrack.cues) {
      return new SubtitleDocument(format, cues);
    }

    for (let i = 0; i < textTrack.cues.length; i++) {
      const cue = textTrack.cues[i];
      cues.push({
        id: `cue_${i}`,
        index: i,
        start: { milliseconds: cue.startTime * 1000, raw: "" },
        end: { milliseconds: cue.endTime * 1000, raw: "" },
        text: getTextFromCue(cue),
      });
    }
    const d = new SubtitleDocument(format, cues);
    d._idCounter = textTrack.cues.length;
    return d;
  }
}

const getTextFromCue = (cue: TextTrackCue): string => {
  if (cue instanceof VTTCue) {
    return cue.text;
  }
  return "";
};
