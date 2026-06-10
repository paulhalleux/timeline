import { type FormatValidationIssue, generateId } from "@ptl/timed-text-core";

import { parseVttSettings } from "./settings";
import { parseVttTimestamp } from "./time";
import type { VttCue, VttDocument } from "./types";

export function parseVtt(content: string): {
  document: VttDocument;
  issues: FormatValidationIssue[];
} {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const issues: FormatValidationIssue[] = [];

  if (!lines[0]?.startsWith("WEBVTT")) {
    return {
      document: emptyDocument(),
      issues: [
        {
          id: "vtt_missing_header",
          severity: "error",
          code: "vtt.missing-header",
          message: "WebVTT content must start with WEBVTT.",
          line: 1,
        },
      ],
    };
  }

  const document = emptyDocument(lines[0]);
  let i = 1;

  while (i < lines.length && lines[i].trim() !== "") i++;

  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    const currentLine = lines[i].trim();

    if (currentLine.startsWith("NOTE")) {
      const commentLines = [currentLine.replace(/^NOTE\s?/, "")];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        commentLines.push(lines[i]);
        i++;
      }
      document.comments.push({
        id: generateId("vtt_note"),
        text: commentLines.join("\n"),
      });
      continue;
    }

    if (currentLine.startsWith("STYLE")) {
      i++;
      const css: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        css.push(lines[i]);
        i++;
      }
      document.styles.push({
        id: generateId("vtt_style"),
        css: css.join("\n"),
      });
      continue;
    }

    if (currentLine.startsWith("REGION")) {
      i++;
      const settings: Record<string, string> = {};
      while (i < lines.length && lines[i].trim() !== "") {
        const [key, value] = lines[i].split("=");
        if (key && value) settings[key.trim()] = value.trim();
        i++;
      }
      document.regions.push({
        id: settings.id ?? generateId("vtt_region"),
        settings,
      });
      continue;
    }

    const cue = parseCue(lines, i, issues);
    if (cue) {
      document.cues.push(cue.cue);
      i = cue.nextLine;
    } else {
      i++;
    }
  }

  return { document, issues };
}

function parseCue(
  lines: string[],
  startLine: number,
  issues: FormatValidationIssue[],
): { cue: VttCue; nextLine: number } | undefined {
  let identifier: string | undefined;
  let timingLine = lines[startLine].trim();
  let i = startLine;

  if (!timingLine.includes("-->")) {
    identifier = timingLine;
    i++;
    timingLine = lines[i]?.trim() ?? "";
  }

  const timingMatch = timingLine.match(
    /^([\d:.]+)\s*-->\s*([\d:.]+)(?:\s+(.*))?$/,
  );
  if (!timingMatch) {
    issues.push({
      id: `vtt_invalid_timing_${startLine + 1}`,
      severity: "error",
      code: "vtt.invalid-timing",
      message: "WebVTT cue is missing a valid timing line.",
      line: startLine + 1,
    });
    return undefined;
  }

  i++;
  const payloadLines: string[] = [];
  while (i < lines.length && lines[i].trim() !== "") {
    payloadLines.push(lines[i]);
    i++;
  }

  try {
    return {
      cue: {
        id: generateId("vtt"),
        identifier,
        startMs: parseVttTimestamp(timingMatch[1]),
        endMs: parseVttTimestamp(timingMatch[2]),
        payload: payloadLines.join("\n"),
        settings: timingMatch[3] ? parseVttSettings(timingMatch[3]) : undefined,
      },
      nextLine: i,
    };
  } catch (error) {
    issues.push({
      id: `vtt_invalid_timestamp_${startLine + 1}`,
      severity: "error",
      code: "vtt.invalid-timestamp",
      message: error instanceof Error ? error.message : "Invalid timestamp.",
      line: startLine + 1,
    });
    return undefined;
  }
}

function emptyDocument(header = "WEBVTT"): VttDocument {
  return {
    type: "vtt",
    header,
    regions: [],
    cues: [],
    comments: [],
    styles: [],
  };
}
