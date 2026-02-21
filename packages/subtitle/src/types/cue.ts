import type { CueContent } from "./content";
import type { Time } from "./time";

/**
 * A single subtitle cue with timing and content.
 */
export interface Cue<TMetadata = unknown> {
  readonly id: string;
  readonly start: Time;
  readonly end: Time;
  readonly content: readonly CueContent[];
  readonly metadata?: TMetadata;
}

/**
 * Input for creating a Cue, where the id is optional and will be generated if not provided.
 */
export interface CueInput<TMetadata = unknown> {
  readonly id?: string;
  readonly start: Time;
  readonly end: Time;
  readonly content: readonly CueContent[];
  readonly metadata?: TMetadata;
}
