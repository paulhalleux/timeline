import { type BaseClip, type ClipType } from "../core/Clip";

/**
 * Represents a text clip within a sequence.
 */
export type TextClip = BaseClip<
  ClipType.Text,
  {
    /** The textual content of the clip */
    content: string;
  }
>;
