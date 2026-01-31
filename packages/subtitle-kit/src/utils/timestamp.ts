import { type Timestamp } from "../core";

/**
 * Utility for parsing and formatting timestamps in the "HH:MM:SS,mmm" format.
 */
export const TimestampParser = {
  /**
   * Parses a timestamp string to a Timestamp object.
   *
   * Supported formats:
   * - "(H)H:(M)M:(S)S,m(mm)"
   * - "(H)H:(M)M:(S)S.m(mm)"
   *
   * @param text - The timestamp string to parse.
   * @returns The parsed Timestamp object.
   * @throws Error if the input string is not in the correct format.
   */
  fromText(text: string): Timestamp {
    const regex =
      /^(?<hours>\d{1,2}):(?<minutes>\d{1,2}):(?<seconds>\d{1,2})[,.](?<milliseconds>\d{1,3})$/;
    const match = text.match(regex);

    if (!match || !match.groups) {
      throw new Error(`Invalid timestamp format: ${text}`);
    }

    const hours = parseInt(match.groups.hours, 10);
    const minutes = parseInt(match.groups.minutes, 10);
    const seconds = parseInt(match.groups.seconds, 10);
    const milliseconds = parseInt(match.groups.milliseconds, 10);

    const totalMilliseconds =
      hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;

    return {
      raw: text,
      milliseconds: totalMilliseconds,
    };
  },
  /**
   * Formats a Timestamp object into a string in the "HH:MM:SS,mmm" format.
   * @param timestamp - The Timestamp object to format.
   * @returns The formatted timestamp string.
   */
  toText(timestamp: Timestamp): string {
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
      "," +
      String(milliseconds).padStart(3, "0")
    );
  },
};
