/**
 * Represents a group of clips in a sequence.
 */
export type ClipGroup = {
  /** Unique identifier for the clip group */
  id: string;
  /** List of clip IDs that belong to this group */
  clipIds: string[];
  /** Optional metadata associated with the clip group */
  metadata?: Record<string, unknown>;
};
