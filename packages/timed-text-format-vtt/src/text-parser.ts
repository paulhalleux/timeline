import {
  type CueContent,
  lineBreak,
  type Style,
  styledContent,
  textContent,
} from "@ptl/timed-text-core";

const TAG_REGEX = /<\/?([biusc])(?:\.([^>]+))?>/gi;

export function parseStyledText(text: string): CueContent[] {
  const result: CueContent[] = [];
  const styleStack: Style[] = [];
  let lastIndex = 0;

  const getCurrentStyle = (): Style =>
    styleStack.reduce((acc, style) => ({ ...acc, ...style }), {});

  const addText = (value: string) => {
    if (!value) return;

    const lines = value.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        const style = getCurrentStyle();
        result.push(
          Object.keys(style).length > 0 ? styledContent(lines[i], style) : textContent(lines[i]),
        );
      }
      if (i < lines.length - 1) {
        result.push(lineBreak());
      }
    }
  };

  let match: RegExpExecArray | null;
  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(text)) !== null) {
    addText(text.slice(lastIndex, match.index));

    if (match[0].startsWith("</")) {
      styleStack.pop();
    } else {
      const style = tagToStyle(match[1].toLowerCase(), match[2]);
      if (style) styleStack.push(style);
    }

    lastIndex = match.index + match[0].length;
  }

  addText(text.slice(lastIndex));
  return result;
}

export function stringifyStyledText(content: readonly CueContent[]): string {
  let result = "";

  for (const part of content) {
    switch (part.type) {
      case "text":
        result += part.text;
        break;
      case "styled":
        result += wrapWithTags(part.text, part.style);
        break;
      case "break":
        result += "\n";
        break;
    }
  }

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
      return className ? { color: className } : null;
    default:
      return null;
  }
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
