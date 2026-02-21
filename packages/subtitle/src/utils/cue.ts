import type { Cue, CueInput } from "../types";

/**
 * Generate a unique ID for a cue.
 *
 * This function creates a random string ID by generating a random number, converting it to base 36 (which includes letters and digits), and taking a substring of it.
 * <br/>
 * The prefix "cue_" is added to ensure that the ID is easily identifiable as a cue ID.
 *
 * @returns A unique string ID for a cue.
 */
export function generateCueId(): string {
  return `cue_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new cue from the given input.
 *
 * This function takes a CueInput object, which may have an optional ID.
 * If the ID is not provided, it generates a unique ID using the {@link generateCueId} function.
 *
 * @param input The input data for creating the cue, including start time, end time, content, and optional metadata.
 * @returns A new Cue object based on the input data.
 */
export function createCue<TMetadata = unknown>(
  input: CueInput<TMetadata>,
): Cue<TMetadata> {
  return {
    id: input.id ?? generateCueId(),
    start: input.start,
    end: input.end,
    content: input.content,
    metadata: input.metadata,
  };
}

/** Clone a cue to create a new instance with the same properties.
 *
 * This function uses the `structuredClone` method to create a deep copy of the cue, ensuring that all nested properties are also cloned.
 *
 * @param cue The cue to clone.
 * @returns A new Cue object that is a clone of the input cue.
 */
export function cloneCue<TMetadata = unknown>(
  cue: Cue<TMetadata>,
): Cue<TMetadata> {
  return structuredClone(cue);
}

/**
 * Calculate the duration of a cue in milliseconds.
 *
 * This function subtracts the start time from the end time to determine how long the cue lasts.
 *
 * @param cue The cue for which to calculate the duration.
 * @returns The duration of the cue in milliseconds.
 */
export function cueDuration(cue: Cue): number {
  return cue.end.ms - cue.start.ms;
}

/**
 * Check if a cue is active at a specific time.
 *
 * This function checks if the given time (in milliseconds) falls within the start and end times of the cue.
 *
 * @param cue The cue to check.
 * @param timeMs The time in milliseconds to check against the cue's timing.
 * @returns True if the cue is active at the given time, false otherwise.
 */
export function isCueAtTime(cue: Cue, timeMs: number): boolean {
  return timeMs >= cue.start.ms && timeMs <= cue.end.ms;
}

/**
 * Check if two cues overlap in time.
 *
 * This function determines if the time intervals of two cues intersect, meaning that they are active at the same time for at least some duration.
 *
 * @param a The first cue to compare.
 * @param b The second cue to compare.
 * @returns True if the cues overlap in time, false otherwise.
 */
export function doCuesOverlap(a: Cue, b: Cue): boolean {
  return a.start.ms < b.end.ms && a.end.ms > b.start.ms;
}
