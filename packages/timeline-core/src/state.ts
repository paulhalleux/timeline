/**
 * Timeline State
 */
export type TimelineState = {
  /**
   * The current position in the timeline (e.g., current tick).
   */
  current: number;

  /**
   * The index of the current chunk.
   */
  chunkIndex: number;

  /**
   * The starting tick of the current chunk.
   */
  chunkStart: number;

  /**
   * The duration of each chunk.
   */
  chunkDuration: number;
};
