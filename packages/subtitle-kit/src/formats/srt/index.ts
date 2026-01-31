import {
  type SubtitleCue,
  SubtitleDocument,
  type SubtitleFormat,
} from "../../core";
import { TimestampParser } from "../../utils/timestamp";

export type SrtMetadata = never;

/**
 * SubRip Subtitle (SRT) format definition.
 * See: https://en.wikipedia.org/wiki/SubRip
 */
export const SrtFormat: SubtitleFormat<"srt", SrtMetadata> = {
  parse(input) {
    const cues: SubtitleCue<SrtMetadata>[] = [];
    const entries = input.replace(/\r\n/g, "\n").trim().split("\n\n");

    for (const entry of entries) {
      const lines = entry.split("\n");
      if (lines.length >= 3) {
        const index = parseInt(lines[0], 10);
        const [startStr, endStr] = lines[1].split(" --> ");
        const text = lines.slice(2).join("\n");

        const start = TimestampParser.fromText(startStr);
        const end = TimestampParser.fromText(endStr);

        cues.push({ index, start, end, text });
      }
    }

    return new SubtitleDocument("srt", cues);
  },
  stringify(doc) {
    const lines: string[] = [];
    for (const cue of doc.getCues()) {
      lines.push(cue.index.toString());
      lines.push(
        `${TimestampParser.toText(cue.start)} --> ${TimestampParser.toText(cue.end)}`,
      );
      lines.push(cue.text);
      lines.push(""); // Empty line between cues
    }
    return lines.join("\n");
  },
};
