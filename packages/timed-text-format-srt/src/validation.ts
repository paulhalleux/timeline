import type { FormatValidationIssue } from "@ptl/timed-text-core";

import type { SrtDocument } from "./types";

export function validateSrt(document: SrtDocument): FormatValidationIssue[] {
  const issues: FormatValidationIssue[] = [];

  document.cues.forEach((cue, cueIndex) => {
    if (cue.index !== cueIndex + 1) {
      issues.push({
        id: `srt_index_${cue.id}`,
        severity: "warning",
        code: "srt.non-sequential-index",
        message: "SRT cue index should match cue order.",
        cueId: cue.id,
      });
    }
    if (cue.startMs >= cue.endMs) {
      issues.push({
        id: `srt_timing_${cue.id}`,
        severity: "error",
        code: "srt.invalid-timing",
        message: "SRT cue start must be before cue end.",
        cueId: cue.id,
      });
    }
  });

  return issues;
}
