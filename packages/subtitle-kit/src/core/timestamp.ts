/**
 * Represents a timestamp inside a subtitle file.
 * Includes both the raw string format and the time in milliseconds.
 */
export type Timestamp = {
  /**
   * The raw string representation of the timestamp.
   */
  raw: string;

  /**
   * The time represented in milliseconds.
   */
  milliseconds: number;
};
