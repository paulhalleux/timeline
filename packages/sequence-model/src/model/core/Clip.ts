import { type AudioClip } from "../clip-types/AudioClip";
import { type ImageClip } from "../clip-types/ImageClip";
import { type TextClip } from "../clip-types/TextClip";
import { type VideoClip } from "../clip-types/VideoClip";
import { type SourceBinding } from "./Source";
import { type TimeRange } from "./Time";

/**
 * Defines the types and interfaces for different clip types.
 */
export enum ClipType {
  Text = "text",
  Image = "image",
  Audio = "audio",
  Video = "video",
}

/**
 * Base interface for a clip.
 * @param Type - The type of the clip (e.g., Text, Image, Audio, Video, Caption).
 * @param Props - Additional properties specific to the clip type.
 */
export type BaseClip<
  Type extends ClipType,
  Props = Record<string, unknown>,
> = Props & {
  /** Unique identifier for the clip */
  id: string;
  /** Type of the clip */
  type: Type;
  /** Time range of the clip within the sequence */
  range: TimeRange;
  /** Sources associated with the clip */
  sources?: SourceBinding[];
  /** Optional metadata associated with the clip */
  metadata?: Record<string, unknown>;
};

/**
 * Union type representing all possible clip types.
 */
export type Clip = TextClip | ImageClip | AudioClip | VideoClip;
