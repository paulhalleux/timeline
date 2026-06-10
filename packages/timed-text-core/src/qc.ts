import type { EditorTimedTextDocument } from "./editor-model";
import type { QcSeverity } from "./editor-model";

/**
 * Quality-control issue reported against an editor document.
 *
 * @example
 * ```ts
 * const issue: QcIssue = {
 *   id: "qc-1",
 *   ruleId: "common.empty-cue",
 *   category: "text",
 *   severity: "warning",
 *   message: "Cue text is empty.",
 * };
 * ```
 */
export interface QcIssue {
  id: string;
  ruleId: string;
  cueId?: string;
  category: QcCategory;
  severity: QcSeverity;
  message: string;
  startMs?: number;
  endMs?: number;
  fixes?: QcFix[];
}

/**
 * Broad QC category used for grouping and filtering issues.
 *
 * @example
 * ```ts
 * const category: QcCategory = "readability";
 * ```
 */
export type QcCategory =
  | "technical"
  | "timing"
  | "readability"
  | "layout"
  | "text"
  | "style-guide"
  | "accessibility";

/**
 * Optional fix attached to a QC issue.
 *
 * @example
 * ```ts
 * const fix: QcFix = {
 *   id: "trim",
 *   label: "Trim overlap",
 *   safety: "needs-review",
 *   apply: (document) => document,
 * };
 * ```
 */
export interface QcFix {
  id: string;
  label: string;
  safety: "safe" | "needs-review" | "risky";
  apply: (document: EditorTimedTextDocument) => EditorTimedTextDocument;
}

/**
 * Shared context passed to QC rules.
 *
 * @example
 * ```ts
 * const context: QcRuleContext = { videoDurationMs: 60_000 };
 * ```
 */
export interface QcRuleContext {
  videoDurationMs?: number;
}

/**
 * Quality-control rule for editor documents.
 *
 * @example
 * ```ts
 * const rule: QcRule = {
 *   id: "custom.no-empty",
 *   run: (document) => [],
 * };
 * ```
 */
export interface QcRule {
  id: string;
  run(document: EditorTimedTextDocument, context?: QcRuleContext): QcIssue[];
}

/**
 * Run a list of QC rules against an editor document.
 *
 * @param document - Editor document to inspect.
 * @param rules - QC rules to execute.
 * @param context - Optional shared QC context.
 * @returns Flattened QC issues from every rule.
 *
 * @example
 * ```ts
 * const issues = runQcRules(document, Object.values(commonQcRules));
 * ```
 */
export function runQcRules(
  document: EditorTimedTextDocument,
  rules: readonly QcRule[],
  context?: QcRuleContext,
): QcIssue[] {
  return rules.flatMap((rule) => rule.run(document, context));
}

/**
 * Built-in QC rules that are safe for most editor workflows.
 *
 * @example
 * ```ts
 * const issues = runQcRules(document, [commonQcRules.invalidTiming]);
 * ```
 */
export const commonQcRules = {
  invalidTiming: {
    id: "common.invalid-timing",
    run(document) {
      return document.tracks.flatMap((track) =>
        track.cues
          .filter((cue) => cue.startMs >= cue.endMs)
          .map((cue) => ({
            id: `qc_${cue.id}_invalid_timing`,
            ruleId: "common.invalid-timing",
            cueId: cue.id,
            category: "timing",
            severity: "error",
            message: "Cue start time must be before end time.",
            startMs: cue.startMs,
            endMs: cue.endMs,
          })),
      );
    },
  } satisfies QcRule,
  emptyCue: {
    id: "common.empty-cue",
    run(document) {
      return document.tracks.flatMap((track) =>
        track.cues
          .filter((cue) => cue.text.trim().length === 0)
          .map((cue) => ({
            id: `qc_${cue.id}_empty`,
            ruleId: "common.empty-cue",
            cueId: cue.id,
            category: "text",
            severity: "warning",
            message: "Cue text is empty.",
            startMs: cue.startMs,
            endMs: cue.endMs,
          })),
      );
    },
  } satisfies QcRule,
} as const;
