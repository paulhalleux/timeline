/**
 * Enum representing the different types of tracks in a sequence.
 */
export enum TrackType {
  Video = "video",
  Audio = "audio",
  Text = "text",
  Image = "image",
}

/**
 * Represents a track within a sequence, containing clips of a specific type.
 */
export type Track = {
  /** Unique identifier for the track */
  id: string;

  /** Index of the track in the sequence */
  index: number;

  /** Type of the track (e.g., video, audio) */
  type: TrackType;

  /** Array of clip IDs associated with this track */
  clipIds: string[];

  /** Metadata associated with the track */
  metadata?: Record<string, unknown>;
};
