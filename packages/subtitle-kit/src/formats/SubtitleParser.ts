import { SrtFormat } from "./srt";

export type SupportedFormats = "srt" /* | "vtt" | "ass"*/;
export const SubtitleParser = {
  /**
   * Parses subtitle content based on the specified format.
   * @param format - The subtitle format to parse.
   * @param input - The subtitle content as a string.
   * @returns The parsed SubtitleDocument.
   * @throws Error if the specified format is not supported.
   */
  parse(format: SupportedFormats, input: string) {
    switch (format) {
      case "srt":
        return SrtFormat.parse(input);
      // case "vtt":
      //   return VttFormat.parse(input);
      // case "ass":
      //   return AssFormat.parse(input);
      default:
        throw new Error(`Unsupported subtitle format: ${format}`);
    }
  },

  /**
   * Stringifies a SubtitleDocument based on the specified format.
   * @param format - The subtitle format to stringify.
   * @param doc - The SubtitleDocument to stringify.
   * @returns The subtitle content as a string.
   * @throws Error if the specified format is not supported.
   */
  stringify(format: SupportedFormats, doc: any) {
    switch (format) {
      case "srt":
        return SrtFormat.stringify(doc);
      // case "vtt":
      //   return VttFormat.stringify(doc);
      // case "ass":
      //   return AssFormat.stringify(doc);
      default:
        throw new Error(`Unsupported subtitle format: ${format}`);
    }
  },
};
