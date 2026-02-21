import type { CueContent, Style } from "../types";
import { lineBreak, styledContent, textContent } from "../utils";

const TAG_REGEX = /<\/?([biusc])(?:\.([^>]+))?>/gi;

/**
 * Parse text with HTML-like styling tags into content segments.
 * Supports: <b>, <i>, <u>, <s>, <c.classname>
 */
export function parseStyledText(text: string): CueContent[] {
  const result: CueContent[] = [];
  const styleStack: Style[] = [];
  let lastIndex = 0;

  const getCurrentStyle = (): Style => {
    if (styleStack.length === 0) return {};
    return styleStack.reduce((acc, s) => ({ ...acc, ...s }), {});
  };

  const addText = (t: string) => {
    if (!t) return;

    const lines = t.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        const style = getCurrentStyle();
        if (Object.keys(style).length > 0) {
          result.push(styledContent(lines[i], style));
        } else {
          result.push(textContent(lines[i]));
        }
      }
      if (i < lines.length - 1) {
        result.push(lineBreak());
      }
    }
  };

  let match: RegExpExecArray | null;
  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(text)) !== null) {
    const beforeTag = text.slice(lastIndex, match.index);
    addText(beforeTag);

    const isClosing = match[0].startsWith("</");
    const tagName = match[1].toLowerCase();

    if (isClosing) {
      styleStack.pop();
    } else {
      const style = tagToStyle(tagName, match[2]);
      if (style) {
        styleStack.push(style);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  addText(text.slice(lastIndex));
  return result;
}

function tagToStyle(tag: string, className?: string): Style | null {
  switch (tag) {
    case "b":
      return { bold: true };
    case "i":
      return { italic: true };
    case "u":
      return { underline: true };
    case "s":
      return { strikethrough: true };
    case "c":
      if (className) {
        return { color: className };
      }
      return null;
    default:
      return null;
  }
}

/**
 * Convert content segments back to text with HTML-like tags.
 */
export function stringifyStyledText(content: readonly CueContent[]): string {
  let result = "";

  for (const c of content) {
    switch (c.type) {
      case "text":
        result += c.text;
        break;
      case "styled":
        result += wrapWithTags(c.text, c.style);
        break;
      case "break":
        result += "\n";
        break;
    }
  }

  return result;
}

function wrapWithTags(text: string, style: Style): string {
  let result = text;

  if (style.bold) result = `<b>${result}</b>`;
  if (style.italic) result = `<i>${result}</i>`;
  if (style.underline) result = `<u>${result}</u>`;
  if (style.strikethrough) result = `<s>${result}</s>`;
  if (style.color) result = `<c.${style.color}>${result}</c>`;

  return result;
}
