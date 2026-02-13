import {
  type SubtitleCue,
  SubtitleDocument,
  type SubtitleFormat,
  type Timestamp,
} from "../../core";

export type VttMetadata = {
  /**
   * Optional cue identifier (can be a string name instead of a number in VTT)
   */
  identifier?: string;
  /**
   * Optional cue settings (position, alignment, etc.)
   */
  settings?: string;
};

/**
 * WebVTT (Web Video Text Tracks) format definition.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API
 */
export const VttFormat: SubtitleFormat<"vtt", VttMetadata> = {
  parse(input) {
    const cues: SubtitleCue<VttMetadata>[] = [];
    const lines = input.replace(/\r\n/g, "\n").trim().split("\n");

    // Validate WEBVTT header
    if (!lines[0]?.startsWith("WEBVTT")) {
      throw new Error("Invalid VTT file: missing WEBVTT header");
    }

    // Skip header and any blank lines after it
    let i = 1;
    while (i < lines.length && lines[i].trim() === "") {
      i++;
    }

    let cueIndex = 1;
    while (i < lines.length) {
      // Skip NOTE blocks
      if (lines[i].startsWith("NOTE")) {
        while (i < lines.length && lines[i].trim() !== "") {
          i++;
        }
        i++; // Skip the empty line after NOTE
        continue;
      }

      // Skip STYLE blocks
      if (lines[i].startsWith("STYLE")) {
        while (i < lines.length && lines[i].trim() !== "") {
          i++;
        }
        i++; // Skip the empty line after STYLE
        continue;
      }

      // Skip REGION blocks
      if (lines[i].startsWith("REGION")) {
        while (i < lines.length && lines[i].trim() !== "") {
          i++;
        }
        i++; // Skip the empty line after REGION
        continue;
      }

      // Skip empty lines
      if (lines[i].trim() === "") {
        i++;
        continue;
      }

      // Parse cue
      let identifier: string | undefined;
      let timingLine: string;

      // Check if current line is a timing line or an identifier
      if (lines[i].includes("-->")) {
        timingLine = lines[i];
      } else {
        // This is a cue identifier
        identifier = lines[i];
        i++;
        if (i >= lines.length) break;
        timingLine = lines[i];
      }

      // Parse timing line
      const timingMatch = timingLine.match(
        /^([\d:.]+)\s*-->\s*([\d:.]+)(?:\s+(.*))?$/,
      );
      if (!timingMatch) {
        i++;
        continue;
      }

      const startStr = timingMatch[1];
      const endStr = timingMatch[2];
      const settings = timingMatch[3] || undefined;

      i++;

      // Collect text lines until empty line or end of file
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }

      const start = parseVttTimestamp(startStr);
      const end = parseVttTimestamp(endStr);
      const text = textLines.join("\n");

      const metadata: VttMetadata = {};
      if (identifier) metadata.identifier = identifier;
      if (settings) metadata.settings = settings;

      cues.push({
        index: cueIndex++,
        start,
        end,
        text,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      i++; // Skip the empty line after cue
    }

    return new SubtitleDocument("vtt", cues);
  },

  stringify(doc) {
    const lines: string[] = ["WEBVTT", ""];

    for (const cue of doc.getCues()) {
      // Add identifier if present
      if (cue.metadata?.identifier) {
        lines.push(cue.metadata.identifier);
      }

      // Add timing line with optional settings
      let timingLine = `${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}`;
      if (cue.metadata?.settings) {
        timingLine += ` ${cue.metadata.settings}`;
      }
      lines.push(timingLine);

      // Add text
      lines.push(cue.text);
      lines.push(""); // Empty line between cues
    }

    return lines.join("\n");
  },

  detect(input) {
    return input.trim().startsWith("WEBVTT");
  },
};

/**
 * Parses a VTT timestamp to a Timestamp object.
 * VTT timestamps can be in formats:
 * - MM:SS.mmm
 * - HH:MM:SS.mmm
 */
function parseVttTimestamp(text: string): Timestamp {
  const trimmed = text.trim();

  // Check if it's in short format (MM:SS.mmm)
  const shortMatch = trimmed.match(
    /^(?<minutes>\d{1,2}):(?<seconds>\d{1,2})\.(?<milliseconds>\d{1,3})$/,
  );

  if (shortMatch?.groups) {
    const minutes = parseInt(shortMatch.groups.minutes, 10);
    const seconds = parseInt(shortMatch.groups.seconds, 10);
    const milliseconds = parseInt(
      shortMatch.groups.milliseconds.padEnd(3, "0"),
      10,
    );

    const totalMilliseconds = minutes * 60000 + seconds * 1000 + milliseconds;

    return {
      raw: text,
      milliseconds: totalMilliseconds,
    };
  }

  // Try long format (HH:MM:SS.mmm)
  const longMatch = trimmed.match(
    /^(?<hours>\d{1,2}):(?<minutes>\d{1,2}):(?<seconds>\d{1,2})\.(?<milliseconds>\d{1,3})$/,
  );

  if (longMatch?.groups) {
    const hours = parseInt(longMatch.groups.hours, 10);
    const minutes = parseInt(longMatch.groups.minutes, 10);
    const seconds = parseInt(longMatch.groups.seconds, 10);
    const milliseconds = parseInt(
      longMatch.groups.milliseconds.padEnd(3, "0"),
      10,
    );

    const totalMilliseconds =
      hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;

    return {
      raw: text,
      milliseconds: totalMilliseconds,
    };
  }

  throw new Error(`Invalid VTT timestamp format: ${text}`);
}

/**
 * Formats a Timestamp object into a VTT timestamp string (HH:MM:SS.mmm).
 */
function formatVttTimestamp(timestamp: { milliseconds: number }): string {
  const totalMilliseconds = timestamp.milliseconds;
  const hours = Math.floor(totalMilliseconds / 3600000);
  const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    String(milliseconds).padStart(3, "0")
  );
}
