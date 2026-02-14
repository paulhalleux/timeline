import { type Signal, WritableSignal } from "@ptl/signal";

import { type SupportedFormats } from "../formats/SubtitleParser";
import { type Timestamp } from "./timestamp";

export type SubtitleCue<Metadata extends Record<string, any>> = {
  index: number;
  start: Timestamp;
  end: Timestamp;
  text: string;
  metadata?: Metadata;
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

  constructor(
    private readonly format: Format,
    cues: SubtitleCue<Metadata>[],
  ) {
    this.cues = new WritableSignal(cues);
    this.updateCache();
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
   * Insert a new cue into the subtitle document.
   * @param cue - The cue to insert.
   */
  insert(cue: Omit<SubtitleCue<Metadata>, "index"> & { index?: number }): void {
    const newCues = structuredClone(this.cues.get());
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
        index: cue.index,
      });
    } else {
      newCues.push({
        ...cue,
        index: newCues.length,
      });
    }
    this.cues.set(newCues);
    this.invalidateCache();
  }

  // Private methods

  private invalidateCache(): void {
    this._startTime = null;
    this._endTime = null;
    this._cueByIndex = null;
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
        index: i,
        start: { milliseconds: cue.startTime * 1000, raw: "" },
        end: { milliseconds: cue.endTime * 1000, raw: "" },
        text: getTextFromCue(cue),
      });
    }
    return new SubtitleDocument(format, cues);
  }
}

const getTextFromCue = (cue: TextTrackCue): string => {
  if (cue instanceof VTTCue) {
    return cue.text;
  }
  return "";
};
