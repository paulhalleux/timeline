/**
 * Represents a chunk in the timeline.
 *
 * A chunk is defined by its index and the starting tick it represents.
 *
 * The notion of chunks is used to segment the timeline into manageable parts,
 * which can be useful for rendering or processing large timelines efficiently.
 *
 * You can consider a chunk as a "page" of the timeline that contains a specific range of ticks.
 */
export type Chunk = {
  /**
   * Index of the chunk.
   */
  index: number;

  /**
   * Starting tick of the chunk.
   */
  start: number;

  /**
   * Width of the chunk in pixels.
   */
  widthPx: number;
};

/**
 * Computes the chunk containing the given unit.
 *
 * It calculates the chunk index and its starting unit based on the current unit,
 * pixels per unit, and chunk width in pixels.
 *
 * A chunk is defined as a segment of the timeline that spans a specific duration in units,
 * determined by the chunk width in pixels and the pixels per unit ratio.
 *
 * The chunk index is calculated by dividing the current unit by the duration of a chunk in units,
 * and flooring the result to get an integer index.
 *
 * The starting unit of the chunk is then derived by multiplying the chunk index
 * by the chunk duration in units.
 *
 * @param current Current unit.
 * @param pxPerUnit Pixels per unit.
 * @param chunkWidthPx Chunk width in pixels.
 * @returns Computed chunk.
 */
export const computeChunk = (
  current: number,
  pxPerUnit: number,
  chunkWidthPx: number,
): Chunk => {
  const range = chunkWidthPx / pxPerUnit;
  const index = Math.floor(current / range);
  const start = Math.floor(index * range);
  return {
    index,
    start,
    widthPx: chunkWidthPx,
  };
};
