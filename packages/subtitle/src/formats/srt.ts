import type { CueInput, SubtitleDocument, Time } from "../types";
import {
  contentToPlainText,
  createDocument,
  plainTextToContent,
} from "../utils";
import type { FormatParser } from "./registry";

export type SrtFormat = "srt";

export const SrtParser: FormatParser<SrtFormat, never> = {
  format: "srt",

  parseTime(text: string): Time {
    const match = text.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/);
    if (!match) {
      throw new Error(`Invalid SRT timestamp: ${text}`);
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const milliseconds = parseInt(match[4], 10);

    return {
      ms: hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds,
    };
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
      "," +
      String(milliseconds).padStart(3, "0")
    );
  },

  parse(input: string): SubtitleDocument<SrtFormat, never> {
    const normalized = input.replace(/\r\n/g, "\n").trim();
    const blocks = normalized.split(/\n\n+/);
    const cues: CueInput<never>[] = [];

    for (const block of blocks) {
      const lines = block.split("\n");
      if (lines.length < 3) continue;

      const indexLine = lines[0].trim();
      if (!/^\d+$/.test(indexLine)) continue;

      const timingLine = lines[1];
      const timingMatch = timingLine.match(/^([\d:,.]+)\s*-->\s*([\d:,.]+)/);
      if (!timingMatch) continue;

      const start = this.parseTime(timingMatch[1]);
      const end = this.parseTime(timingMatch[2]);
      const text = lines.slice(2).join("\n");

      cues.push({
        start,
        end,
        content: plainTextToContent(text),
      });
    }

    return createDocument({ format: "srt", cues });
  },

  stringify(doc: SubtitleDocument<SrtFormat, never>): string {
    const lines: string[] = [];

    doc.cues.forEach((cue, index) => {
      lines.push(String(index + 1));
      lines.push(
        `${this.formatTime(cue.start)} --> ${this.formatTime(cue.end)}`,
      );
      lines.push(contentToPlainText(cue.content));
      lines.push("");
    });

    return lines.join("\n");
  },

  detect(input: string): boolean {
    const trimmed = input.trim();
    return /^\d+\s*\n\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(trimmed);
  },
};
