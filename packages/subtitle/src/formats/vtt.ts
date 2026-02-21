import type { CueInput, SubtitleDocument, Time } from "../types";
import { createDocument } from "../utils";
import type { FormatParser } from "./registry";
import { parseStyledText, stringifyStyledText } from "./text-parser";

export type VttFormat = "vtt";

export interface VttCueMetadata {
  identifier?: string;
  settings?: VttCueSettings;
}

export interface VttCueSettings {
  vertical?: "rl" | "lr";
  line?: string;
  position?: string;
  size?: string;
  align?: "start" | "center" | "end" | "left" | "right";
  region?: string;
}

function parseVttSettings(str: string): VttCueSettings {
  const settings: VttCueSettings = {};
  const pairs = str.split(/\s+/);

  for (const pair of pairs) {
    const [key, value] = pair.split(":");
    if (!key || !value) continue;

    switch (key) {
      case "vertical":
        if (value === "rl" || value === "lr") {
          settings.vertical = value;
        }
        break;
      case "line":
        settings.line = value;
        break;
      case "position":
        settings.position = value;
        break;
      case "size":
        settings.size = value;
        break;
      case "align":
        if (["start", "center", "end", "left", "right"].includes(value)) {
          settings.align = value as VttCueSettings["align"];
        }
        break;
      case "region":
        settings.region = value;
        break;
    }
  }

  return settings;
}

function stringifyVttSettings(settings: VttCueSettings): string {
  const parts: string[] = [];

  if (settings.vertical) parts.push(`vertical:${settings.vertical}`);
  if (settings.line) parts.push(`line:${settings.line}`);
  if (settings.position) parts.push(`position:${settings.position}`);
  if (settings.size) parts.push(`size:${settings.size}`);
  if (settings.align) parts.push(`align:${settings.align}`);
  if (settings.region) parts.push(`region:${settings.region}`);

  return parts.join(" ");
}

export const VttParser: FormatParser<VttFormat, VttCueMetadata> = {
  format: "vtt",

  parseTime(text: string): Time {
    const trimmed = text.trim();

    // Short format: MM:SS.mmm
    const shortMatch = trimmed.match(/^(\d{1,2}):(\d{2})\.(\d{3})$/);
    if (shortMatch) {
      const minutes = parseInt(shortMatch[1], 10);
      const seconds = parseInt(shortMatch[2], 10);
      const milliseconds = parseInt(shortMatch[3], 10);
      return { ms: minutes * 60000 + seconds * 1000 + milliseconds };
    }

    // Long format: HH:MM:SS.mmm
    const longMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})$/);
    if (longMatch) {
      const hours = parseInt(longMatch[1], 10);
      const minutes = parseInt(longMatch[2], 10);
      const seconds = parseInt(longMatch[3], 10);
      const milliseconds = parseInt(longMatch[4], 10);
      return {
        ms: hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds,
      };
    }

    throw new Error(`Invalid VTT timestamp: ${text}`);
  },

  formatTime(t: Time): string {
    const ms = t.ms;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0") +
      "." +
      String(milliseconds).padStart(3, "0")
    );
  },

  parse(input: string): SubtitleDocument<VttFormat, VttCueMetadata> {
    const normalized = input.replace(/\r\n/g, "\n").trim();
    const lines = normalized.split("\n");

    if (!lines[0]?.startsWith("WEBVTT")) {
      throw new Error("Invalid VTT: missing WEBVTT header");
    }

    const cues: CueInput<VttCueMetadata>[] = [];
    let i = 1;

    // Skip header content
    while (i < lines.length && lines[i].trim() !== "") {
      i++;
    }

    while (i < lines.length) {
      // Skip empty lines
      while (i < lines.length && lines[i].trim() === "") {
        i++;
      }
      if (i >= lines.length) break;

      // Skip NOTE, STYLE, REGION blocks
      const currentLine = lines[i].trim();
      if (
        currentLine.startsWith("NOTE") ||
        currentLine.startsWith("STYLE") ||
        currentLine.startsWith("REGION")
      ) {
        while (i < lines.length && lines[i].trim() !== "") {
          i++;
        }
        continue;
      }

      // Parse cue
      let identifier: string | undefined;
      let timingLine: string;

      if (!currentLine.includes("-->")) {
        identifier = currentLine;
        i++;
        if (i >= lines.length) break;
        timingLine = lines[i];
      } else {
        timingLine = currentLine;
      }

      const timingMatch = timingLine.match(
        /^([\d:.]+)\s*-->\s*([\d:.]+)(?:\s+(.*))?$/,
      );
      if (!timingMatch) {
        i++;
        continue;
      }

      const start = this.parseTime(timingMatch[1]);
      const end = this.parseTime(timingMatch[2]);
      const settingsStr = timingMatch[3];
      const settings = settingsStr ? parseVttSettings(settingsStr) : undefined;

      i++;

      // Collect text lines
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }

      const content = parseStyledText(textLines.join("\n"));
      const metadata: VttCueMetadata = {};
      if (identifier) metadata.identifier = identifier;
      if (settings) metadata.settings = settings;

      cues.push({
        start,
        end,
        content,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    }

    return createDocument({ format: "vtt", cues });
  },

  stringify(doc: SubtitleDocument<VttFormat, VttCueMetadata>): string {
    const lines: string[] = ["WEBVTT", ""];

    for (const cue of doc.cues) {
      if (cue.metadata?.identifier) {
        lines.push(cue.metadata.identifier);
      }

      let timingLine = `${this.formatTime(cue.start)} --> ${this.formatTime(cue.end)}`;
      if (cue.metadata?.settings) {
        timingLine += " " + stringifyVttSettings(cue.metadata.settings);
      }
      lines.push(timingLine);

      lines.push(stringifyStyledText(cue.content));
      lines.push("");
    }

    return lines.join("\n");
  },

  detect(input: string): boolean {
    return input.trim().startsWith("WEBVTT");
  },
};
