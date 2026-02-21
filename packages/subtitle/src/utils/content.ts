import type { CueContent, Style } from "../types";

/**
 * Create a text content object for a cue.
 *
 * @param text The text to include in the content.
 * @returns A CueContent object representing the text content.
 */
export function textContent(text: string): CueContent {
  return { type: "text", text };
}

/**
 * Create a styled content object for a cue.
 *
 * @param text The text to include in the content.
 * @param style The style to apply to the text.
 * @returns A CueContent object representing the styled content.
 */
export function styledContent(text: string, style: Style): CueContent {
  return { type: "styled", text, style };
}

/**
 * Create a line break content object for a cue.
 *
 * @returns A CueContent object representing a line break.
 */
export function lineBreak(): CueContent {
  return { type: "break" };
}

/**
 * Convert an array of {@link CueContent} objects to plain text.
 *
 * This function concatenates the text from all CueContent objects, inserting line breaks where appropriate.
 * <br/>
 * It ignores any styling information, as plain text does not support styling.
 *
 * @param content The array of CueContent objects to convert.
 * @returns A string representing the plain text content.
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
 * Convert plain text to an array of {@link CueContent} objects.
 *
 * This function splits the input text by line breaks and creates a CueContent object for each line of text, as well as line break objects between lines.
 * <br/>
 * This is a simple conversion that does not preserve any styling or formatting information, as plain text does not contain such information.
 *
 * @param text The plain text to convert.
 * @returns An array of CueContent objects representing the content.
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
