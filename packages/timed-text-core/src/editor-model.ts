import type { TimedTextFormatId } from "./adapter";

/**
 * Format-agnostic document model used by editor helpers and commands.
 *
 * @example
 * ```ts
 * const document: EditorTimedTextDocument = {
 *   id: "doc-1",
 *   format: "vtt",
 *   tracks: [],
 * };
 * ```
 */
export interface EditorTimedTextDocument {
  id: string;
  format: TimedTextFormatId;
  tracks: EditorTimedTextTrack[];
  metadata?: Record<string, unknown>;
}

/**
 * One logical timed-text track in the editor model.
 *
 * @example
 * ```ts
 * const track: EditorTimedTextTrack = {
 *   id: "subtitles",
 *   kind: "subtitle",
 *   cues: [],
 * };
 * ```
 */
export interface EditorTimedTextTrack {
  id: string;
  language?: string;
  kind: EditorTimedTextTrackKind;
  cues: EditorTimedTextCue[];
}

/**
 * Supported semantic track categories in the editor model.
 *
 * @example
 * ```ts
 * const kind: EditorTimedTextTrackKind = "caption";
 * ```
 */
export type EditorTimedTextTrackKind = "subtitle" | "caption" | "sdh" | "forced" | "transcript";

/**
 * Format-agnostic cue used by editor helpers and commands.
 *
 * @example
 * ```ts
 * const cue: EditorTimedTextCue = {
 *   id: "cue-1",
 *   startMs: 1_000,
 *   endMs: 2_500,
 *   text: "Hello",
 * };
 * ```
 */
export interface EditorTimedTextCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
  tags?: EditorCueTag[];
  style?: EditorCueStyle;
  metadata?: Record<string, unknown>;
}

/**
 * Semantic tags that can be attached to editor cues.
 *
 * @example
 * ```ts
 * const tag: EditorCueTag = "sound-effect";
 * ```
 */
export type EditorCueTag =
  | "dialogue"
  | "sound-effect"
  | "music"
  | "speaker-label"
  | "onscreen-text"
  | "forced";

/**
 * Portable style hints used by the editor model.
 *
 * @example
 * ```ts
 * const style: EditorCueStyle = { italic: true, align: "center" };
 * ```
 */
export interface EditorCueStyle {
  italic?: boolean;
  bold?: boolean;
  underline?: boolean;
  position?: "top" | "bottom" | "custom";
  align?: "start" | "center" | "end";
}

/**
 * Severity shared by QC and validation reports.
 *
 * @example
 * ```ts
 * const severity: QcSeverity = "warning";
 * ```
 */
export type QcSeverity = "error" | "warning" | "info";

/**
 * Format or editor validation issue.
 *
 * @example
 * ```ts
 * const issue: FormatValidationIssue = {
 *   id: "issue-1",
 *   severity: "error",
 *   code: "cue.invalid-timing",
 *   message: "Start must be before end.",
 * };
 * ```
 */
export interface FormatValidationIssue {
  id: string;
  severity: QcSeverity;
  code: string;
  message: string;
  cueId?: string;
  line?: number;
  column?: number;
}

/**
 * Warning produced while converting between native and editor documents.
 *
 * @example
 * ```ts
 * const warning: ConversionWarning = {
 *   id: "warning-1",
 *   severity: "warning",
 *   code: "style.dropped",
 *   message: "Unsupported style was not preserved.",
 * };
 * ```
 */
export interface ConversionWarning {
  id: string;
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  cueId?: string;
}
