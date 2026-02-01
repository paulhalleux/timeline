import { type Clip } from "./Clip";
import { type ClipGroup } from "./ClipGroup";
import { type Source } from "./Source";
import { type Track } from "./Track";

/**
 * Represents a sequence containing tracks, clips, sources, and clip groups.
 */
export type Sequence = {
  /** Unique identifier for the sequence */
  id: string;

  tracks: Record<string, Track>;
  clips: Record<string, Clip>;
  sources: Record<string, Source>;
  clipGroups: Record<string, ClipGroup>;

  /** Metadata associated with the sequence */
  metadata: {
    name: string;
    frameRate: number;
    resolution: { width: number; height: number };
    [key: string]: any;
  };
};
