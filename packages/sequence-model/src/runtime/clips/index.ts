import type { Clip } from "../../model";
import type { SequenceInstance } from "../SequenceInstance";
import { AudioClipInstance } from "./AudioClipInstance";
import { ImageClipInstance } from "./ImageClipInstance";
import { TextClipInstance } from "./TextClipInstance";
import { VideoClipInstance } from "./VideoClipInstance";

export type * from "./AudioClipInstance";
export type * from "./ClipInstance";
export type * from "./ImageClipInstance";
export type * from "./TextClipInstance";
export type * from "./VideoClipInstance";

/**
 * Factory function to create a ClipInstance based on the clip type.
 *
 * @param owner - The owning SequenceInstance.
 * @param clip - The clip model.
 * @returns An instance of ClipInstance corresponding to the clip type.
 * @throws Error if the clip type is unsupported.
 */
export function createClipInstance(owner: SequenceInstance, clip: Clip) {
  switch (clip.type) {
    case "video": {
      return new VideoClipInstance(owner, clip.id);
    }
    case "audio": {
      return new AudioClipInstance(owner, clip.id);
    }
    case "text": {
      return new TextClipInstance(owner, clip.id);
    }
    case "image": {
      return new ImageClipInstance(owner, clip.id);
    }
    default:
      throw new Error(`Unsupported clip type: ${(clip as any).type}`);
  }
}
