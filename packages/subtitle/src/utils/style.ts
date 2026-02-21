import type { Style } from "../types";

/**
 * An empty style object that can be used as a default or placeholder when no styles are defined.
 * This object is frozen to prevent modification, ensuring it remains immutable throughout the application.
 */
export const emptyStyle: Style = Object.freeze({});

/**
 * Merge two styles, with the second style taking precedence over the first.
 *
 * @param base The base style to merge with the override style.
 * @param override The style that will override the base style. Properties in this style will take precedence over those in the base style.
 * @returns A new style object that is the result of merging the base and override styles.
 */
export function mergeStyles(base: Style, override: Style): Style {
  return { ...base, ...override };
}

/**
 * Check if a style object has any properties defined.
 *
 * @param style The style object to check.
 * @returns `true` if the style has at least one property defined, otherwise `false`.
 */
export function hasStyle(style: Style): boolean {
  return Object.keys(style).length > 0;
}
