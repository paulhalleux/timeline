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
  Format extends SupportedFormats,
  Metadata extends Record<string, any>,
> {
  private cues: SubtitleCue<Metadata>[];

  constructor(
    private readonly format: Format,
    cues: SubtitleCue<Metadata>[],
  ) {
    this.cues = cues;
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
}
