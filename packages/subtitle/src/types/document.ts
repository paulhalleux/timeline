import type { Cue, CueInput } from "./cue";

/**
 * An immutable subtitle document containing cues.
 */
export interface SubtitleDocument<
  TFormat extends string = string,
  TMetadata = unknown,
> {
  readonly format: TFormat;
  readonly cues: readonly Cue<TMetadata>[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Input structure for creating a subtitle document.
 */
export interface DocumentInput<
  TFormat extends string = string,
  TMetadata = unknown,
> {
  readonly format: TFormat;
  readonly cues: readonly CueInput<TMetadata>[];
  readonly metadata?: Record<string, unknown>;
}
