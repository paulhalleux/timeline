import type { FormatValidationIssue } from "@ptl/timed-text-core";

import type { VttDocument } from "./types";

export function validateVtt(document: VttDocument): FormatValidationIssue[] {
  const issues: FormatValidationIssue[] = [];
  const regionIds = new Set(document.regions.map((region) => region.id));

  document.cues.forEach((cue) => {
    if (cue.startMs >= cue.endMs) {
      issues.push({
        id: `vtt_timing_${cue.id}`,
        severity: "error",
        code: "vtt.invalid-timing",
        message: "WebVTT cue start must be before cue end.",
        cueId: cue.id,
      });
    }

    if (cue.settings?.region && !regionIds.has(cue.settings.region)) {
      issues.push({
        id: `vtt_missing_region_${cue.id}`,
        severity: "warning",
        code: "vtt.missing-region",
        message: "WebVTT cue references a region that is not defined.",
        cueId: cue.id,
      });
    }
  });

  return issues;
}
