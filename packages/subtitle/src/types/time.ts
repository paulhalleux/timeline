/**
 * Represents time in milliseconds.
 */
export interface Time {
  readonly ms: number;
}

/**
 * Represents individual time components for hours, minutes, seconds, and milliseconds.
 */
export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}
