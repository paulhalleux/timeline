import type { Style } from "./style";

/**
 * Structured cue content used by format packages that preserve inline styling.
 *
 * @example
 * ```ts
 * const content: CueContent[] = [
 *   { type: "text", text: "Hello" },
 *   { type: "break" },
 *   { type: "styled", text: "world", style: { italic: true } },
 * ];
 * ```
 */
export type CueContent =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "styled"; readonly text: string; readonly style: Style }
  | { readonly type: "break" };

/**
 * Create plain text cue content.
 *
 * @param text - Text to wrap.
 * @returns A text content segment.
 *
 * @example
 * ```ts
 * const segment = textContent("Hello");
 * ```
 */
export function textContent(text: string): CueContent {
  return { type: "text", text };
}

/**
 * Create styled text cue content.
 *
 * @param text - Text to wrap.
 * @param style - Style attached to the text.
 * @returns A styled content segment.
 *
 * @example
 * ```ts
 * const segment = styledContent("Hello", { italic: true });
 * ```
 */
export function styledContent(text: string, style: Style): CueContent {
  return { type: "styled", text, style };
}

/**
 * Create a line-break content segment.
 *
 * @returns A break segment.
 *
 * @example
 * ```ts
 * const content = [textContent("A"), lineBreak(), textContent("B")];
 * ```
 */
export function lineBreak(): CueContent {
  return { type: "break" };
}

/**
 * Convert structured cue content to plain text.
 *
 * @param content - Content segments to flatten.
 * @returns Plain text with break segments converted to newlines.
 *
 * @example
 * ```ts
 * const text = contentToPlainText([textContent("A"), lineBreak()]);
 * ```
 */
export function contentToPlainText(content: readonly CueContent[]): string {
  return content
    .map((c) => {
      switch (c.type) {
        case "text":
        case "styled":
          return c.text;
        case "break":
          return "\n";
      }
    })
    .join("");
}

/**
 * Convert plain text to structured cue content.
 *
 * @param text - Plain text to convert. Newlines become break segments.
 * @returns Content segments representing the text.
 *
 * @example
 * ```ts
 * const content = plainTextToContent("A\nB");
 * ```
 */
export function plainTextToContent(text: string): CueContent[] {
  const lines = text.split("\n");
  const result: CueContent[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
      result.push(textContent(lines[i]));
    }
    if (i < lines.length - 1) {
      result.push(lineBreak());
    }
  }

  return result;
}
