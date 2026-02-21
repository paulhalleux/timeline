import type { SubtitleDocument, Time } from "../types";
import { SrtParser } from "./srt";
import { VttParser } from "./vtt";

/**
 * A format parser that can parse and stringify subtitle documents.
 */
export interface FormatParser<
  TFormat extends string = string,
  TMetadata = unknown,
> {
  readonly format: TFormat;

  /**
   * Parse a subtitle string into a document.
   * @param input The subtitle string to parse.
   * @returns The parsed subtitle document.
   */
  parse(input: string): SubtitleDocument<TFormat, TMetadata>;

  /**
   * Stringify a document into a subtitle string.
   * @param doc The document to stringify.
   * @returns The stringified subtitle.
   */
  stringify(doc: SubtitleDocument<TFormat, TMetadata>): string;

  /**
   * Detect if the input string matches this format.
   * @param input The input string to check.
   * @returns True if the input matches this format, false otherwise.
   */
  detect?(input: string): boolean;

  /**
   * Parse a timestamp string into a Time object.
   * @param text The timestamp string to parse.
   * @returns The parsed Time object.
   */
  parseTime(text: string): Time;

  /**
   * Format a Time object into a timestamp string.
   * @param time The Time object to format.
   * @returns The formatted timestamp string.
   */
  formatTime(time: Time): string;
}

/**
 * Registry for format parsers.
 */
export class FormatRegistry {
  private readonly parsers;

  constructor(parsers?: FormatParser[]) {
    this.parsers = new Map<string, FormatParser>();
    if (parsers) {
      for (const parser of parsers) {
        this.register(parser);
      }
    }
  }

  register<TFormat extends string, TMetadata>(
    parser: FormatParser<TFormat, TMetadata>,
  ): this {
    this.parsers.set(parser.format, parser as FormatParser);
    return this;
  }

  get<TFormat extends string>(
    format: TFormat,
  ): FormatParser<TFormat> | undefined {
    return this.parsers.get(format) as FormatParser<TFormat> | undefined;
  }

  detect(input: string): FormatParser | undefined {
    for (const parser of this.parsers.values()) {
      if (parser.detect?.(input)) {
        return parser;
      }
    }
    return undefined;
  }

  parse(input: string, format?: string): SubtitleDocument {
    const parser = format ? this.get(format) : this.detect(input);
    if (!parser) {
      throw new Error(
        format ? `Unknown format: ${format}` : "Could not detect format",
      );
    }
    return parser.parse(input);
  }

  stringify(doc: SubtitleDocument): string {
    const parser = this.get(doc.format);
    if (!parser) {
      throw new Error(`Unknown format: ${doc.format}`);
    }
    return parser.stringify(doc);
  }

  getFormats(): string[] {
    return [...this.parsers.keys()];
  }
}

export const defaultRegistry = new FormatRegistry([SrtParser, VttParser]);
