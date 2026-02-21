/**
 * Text styling properties supported by subtitle formats.
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
