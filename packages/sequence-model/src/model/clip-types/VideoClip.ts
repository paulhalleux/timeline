import { type BaseClip, type ClipType } from "../core/Clip";

/**
 * Represents a video clip within a sequence.
 */
export type VideoClip = BaseClip<
  ClipType.Video,
  {
    /** The in point of the video clip */
    inPoint: number;
    /** The out point of the video clip */
    outPoint: number;
  }
>;
