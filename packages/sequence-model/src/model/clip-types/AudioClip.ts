import { type BaseClip, type ClipType } from "../core/Clip";

/**
 * Represents an audio clip within a sequence.
 */
export type AudioClip = BaseClip<
  ClipType.Audio,
  {
    /** The in point of the audio clip */
    inPoint: number;
    /** The out point of the audio clip */
    outPoint: number;
  }
>;
