/**
 * Millisecond time value used by structured format helpers.
 *
 * @example
 * ```ts
 * const start: Time = { ms: 1_000 };
 * ```
 */
export interface Time {
  readonly ms: number;
}

/**
 * Decomposed time parts.
 *
 * @example
 * ```ts
 * const parts: TimeComponents = {
 *   hours: 0,
 *   minutes: 1,
 *   seconds: 2,
 *   milliseconds: 300,
 * };
 * ```
 */
export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Create a non-negative rounded time value.
 *
 * @param ms - Milliseconds to normalize.
 * @returns A time object clamped to zero and rounded.
 *
 * @example
 * ```ts
 * const t = time(1234.6);
 * ```
 */
export function time(ms: number): Time {
  return { ms: Math.max(0, Math.round(ms)) };
}

/**
 * Create a time value from decomposed parts.
 *
 * @param components - Hours, minutes, seconds, and milliseconds.
 * @returns A normalized time value.
 *
 * @example
 * ```ts
 * const t = timeFromComponents({ hours: 0, minutes: 0, seconds: 1, milliseconds: 500 });
 * ```
 */
export function timeFromComponents({
  hours,
  minutes,
  seconds,
  milliseconds,
}: TimeComponents): Time {
  return time(
    hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds,
  );
}

/**
 * Decompose a time value into parts.
 *
 * @param t - Time value to decompose.
 * @returns Hours, minutes, seconds, and milliseconds.
 *
 * @example
 * ```ts
 * const parts = timeToComponents(time(3_650_250));
 * ```
 */
export function timeToComponents(t: Time): TimeComponents {
  const ms = t.ms;
  return {
    hours: Math.floor(ms / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    milliseconds: ms % 1000,
  };
}

/**
 * Add two time values.
 *
 * @param a - First time value.
 * @param b - Second time value.
 * @returns Sum as a normalized time value.
 *
 * @example
 * ```ts
 * const end = addTime(start, duration);
 * ```
 */
export function addTime(a: Time, b: Time): Time {
  return time(a.ms + b.ms);
}

/**
 * Subtract one time value from another.
 *
 * @param a - Time value to subtract from.
 * @param b - Time value to subtract.
 * @returns Difference as a normalized time value.
 *
 * @example
 * ```ts
 * const duration = subtractTime(end, start);
 * ```
 */
export function subtractTime(a: Time, b: Time): Time {
  return time(a.ms - b.ms);
}

/**
 * Scale a time value by a factor.
 *
 * @param t - Time value to scale.
 * @param factor - Multiplication factor.
 * @returns Scaled normalized time value.
 *
 * @example
 * ```ts
 * const slower = scaleTime(duration, 2);
 * ```
 */
export function scaleTime(t: Time, factor: number): Time {
  return time(t.ms * factor);
}
