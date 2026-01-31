import { type SupportedFormats } from "../formats/SubtitleParser";
import { type SubtitleDocument } from "./document";

/**
 * Subtitle Format Interface
 * Defines the structure and methods required for subtitle format implementations.
 */
export interface SubtitleFormat<
  Format extends SupportedFormats,
  Metadata extends Record<string, any>,
> {
  /**
   * Parses a subtitle document from a string input.
   * @param input - The subtitle content as a string.
   * @returns A SubtitleDocument object representing the parsed subtitles.
   */
  parse(input: string): SubtitleDocument<Format, Metadata>;

  /**
   * Converts a SubtitleDocument object back into a string format.
   * @param doc - The SubtitleDocument to be converted.
   * @returns A string representation of the subtitle document.
   */
  stringify(doc: SubtitleDocument<Format, Metadata>): string;

  /**
   * Detects if the given input string matches the subtitle format.
   * @param input - The subtitle content as a string.
   * @returns A boolean indicating whether the input matches the format.
   */
  detect?(input: string): boolean;
}
