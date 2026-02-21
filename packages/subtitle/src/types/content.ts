import type { Style } from "./style";

/**
 * A segment of content within a cue.
 * Can be plain text, styled text, or a line break.
 */
export type CueContent =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "styled"; readonly text: string; readonly style: Style }
  | { readonly type: "break" };
