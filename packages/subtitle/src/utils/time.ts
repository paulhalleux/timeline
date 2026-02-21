import type { Time, TimeComponents } from "../types";

/**
 * Create a {@link Time} object from a number of milliseconds.
 *
 * This function ensures that the time is non-negative and rounds it to the nearest integer.
 *
 * @param ms The time in milliseconds.
 * @returns A {@link Time} object representing the given time.
 */
export function time(ms: number): Time {
  return { ms: Math.max(0, Math.round(ms)) };
}

/**
 * Create a {@link Time} object from individual time components.
 *
 * This function converts hours, minutes, seconds, and milliseconds into a total number of milliseconds and creates a {@link Time} object from it.
 *
 * @param hours The number of hours.
 * @param minutes The number of minutes.
 * @param seconds The number of seconds.
 * @param milliseconds The number of milliseconds.
 * @returns A {@link Time} object representing the total time calculated from the components.
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
 * Convert a {@link Time} object into its individual time components.
 *
 * This function takes the total number of milliseconds from the {@link Time} object and calculates the corresponding hours, minutes, seconds, and milliseconds.
 *
 * @param t The {@link Time} object to convert.
 * @returns An object containing the hours, minutes, seconds, and milliseconds components of the time.
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
 * Add two {@link Time} objects together.
 *
 * This function sums the milliseconds of both {@link Time} objects and returns a new {@link Time} object representing the total time.
 *
 * @param a The first {@link Time} object.
 * @param b The second {@link Time} object.
 * @returns A new {@link Time} object representing the sum of the two times.
 */
export function addTime(a: Time, b: Time): Time {
  return time(a.ms + b.ms);
}

/**
 * Subtract one {@link Time} object from another.
 *
 * This function subtracts the milliseconds of the second {@link Time} object from the first and returns a new {@link Time} object representing the difference.
 * <br/>
 * The resulting time will not be negative; if the second time is greater than the first, the result will be zero.
 *
 * @param a The {@link Time} object to subtract from.
 * @param b The {@link Time} object to subtract.
 * @returns A new {@link Time} object representing the difference between the two times.
 */
export function subtractTime(a: Time, b: Time): Time {
  return time(a.ms - b.ms);
}

export function scaleTime(t: Time, factor: number): Time {
  return time(t.ms * factor);
}
