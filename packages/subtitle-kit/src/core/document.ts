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
  private cues: SubtitleCue<Metadata>[];

  private _startTime: number | null = null;
  private _endTime: number | null = null;

  constructor(
    private readonly format: Format,
    cues: SubtitleCue<Metadata>[],
  ) {
    this.cues = cues;
    this.invalidateCache();
  }

  // Getters

  /**
   * Get the cues of the subtitle document.
   * @returns The cues of the subtitle document.
   */
  getCues(): SubtitleCue<Metadata>[] {
    return this.cues;
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
      this.invalidateCache();
    }

    return this._startTime ?? 0;
  }

  /**
   * Get the end time of the subtitle document in milliseconds.
   * @returns The end time in milliseconds.
   */
  getEndTime(): number {
    if (this._endTime === null) {
      this.invalidateCache();
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
    let high = this.cues.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cue = this.cues[mid];

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

  // Setters

  /**
   * Update the cues of the subtitle document.
   * @param cues - The new cues to set.
   */
  setCues(cues: SubtitleCue<Metadata>[]): void {
    this.cues = cues;
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
    const cue = this.cues.find((c) => c.index === index);
    if (cue) {
      Object.assign(cue, newCue);
    }
  }

  /**
   * Remove a specific cue from the subtitle document.
   * @param index - The index of the cue to remove.
   */
  remove(index: number): void {
    this.cues = this.cues.filter((c) => c.index !== index);
    this.cues.forEach((cue) => {
      if (cue.index > index) cue.index = cue.index - 1;
    });
  }

  /**
   * Insert a new cue into the subtitle document.
   * @param cue - The cue to insert.
   */
  insert(cue: Omit<SubtitleCue<Metadata>, "index"> & { index?: number }): void {
    if (
      cue.index !== undefined &&
      cue.index >= 0 &&
      cue.index <= this.cues.length
    ) {
      this.cues.forEach((c) => {
        if (cue.index && c.index >= cue.index) c.index = c.index + 1;
      });
      this.cues.splice(cue.index - 1, 0, {
        ...cue,
        index: cue.index,
      });
    } else {
      this.cues.push({
        ...cue,
        index: this.cues.length,
      });
    }
  }

  // Private methods

  private invalidateCache(): void {
    if (this.cues.length === 0) {
      this._startTime = 0;
      this._endTime = 0;
      return;
    }

    this._startTime = Math.min(
      ...this.cues.map((cue) => cue.start.milliseconds),
    );
    this._endTime = Math.max(...this.cues.map((cue) => cue.end.milliseconds));
  }
}
