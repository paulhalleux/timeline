/**
 * Portable style object for structured cue content.
 *
 * @example
 * ```ts
 * const style: Style = { italic: true, color: "#fff" };
 * ```
 */
export interface Style {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strikethrough?: boolean;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly fontSize?: number;
  readonly fontFamily?: string;
}

/**
 * Shared immutable empty style.
 *
 * @example
 * ```ts
 * const style = hasStyle(input) ? input : emptyStyle;
 * ```
 */
export const emptyStyle: Style = Object.freeze({});

/**
 * Merge two style objects.
 *
 * @param base - Base style values.
 * @param override - Style values that should take precedence.
 * @returns A new merged style object.
 *
 * @example
 * ```ts
 * const style = mergeStyles({ italic: true }, { color: "#fff" });
 * ```
 */
export function mergeStyles(base: Style, override: Style): Style {
  return { ...base, ...override };
}

/**
 * Check whether a style object contains any properties.
 *
 * @param style - Style object to inspect.
 * @returns `true` when at least one style property is present.
 *
 * @example
 * ```ts
 * if (hasStyle(cueStyle)) renderStyledText();
 * ```
 */
export function hasStyle(style: Style): boolean {
  return Object.keys(style).length > 0;
}
