import { type FormatValidationIssue, generateId } from "@ptl/timed-text-core";

import { parseSrtTimestamp } from "./time";
import type { SrtCue, SrtDocument } from "./types";

export function parseSrt(content: string): {
  document: SrtDocument;
  issues: FormatValidationIssue[];
} {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.length === 0 ? [] : normalized.split(/\n\n+/);
  const cues: SrtCue[] = [];
  const issues: FormatValidationIssue[] = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block.split("\n");
    const index = Number.parseInt(lines[0]?.trim() ?? "", 10);

    if (!Number.isInteger(index)) {
      issues.push({
        id: `srt_invalid_index_${blockIndex + 1}`,
        severity: "error",
        code: "srt.invalid-index",
        message: "SRT cue block is missing a numeric index.",
        line: blockIndex + 1,
      });
      return;
    }

    const timingLine = lines[1] ?? "";
    const timingMatch = timingLine.match(/^([\d:,.]+)\s*-->\s*([\d:,.]+)/);
    if (!timingMatch) {
      issues.push({
        id: `srt_invalid_timing_${index}`,
        severity: "error",
        code: "srt.invalid-timing",
        message: "SRT cue block is missing a valid timing line.",
        cueId: String(index),
      });
      return;
    }

    try {
      cues.push({
        id: generateId("srt"),
        index,
        startMs: parseSrtTimestamp(timingMatch[1]),
        endMs: parseSrtTimestamp(timingMatch[2]),
        lines: lines.slice(2),
      });
    } catch (error) {
      issues.push({
        id: `srt_invalid_timestamp_${index}`,
        severity: "error",
        code: "srt.invalid-timestamp",
        message: error instanceof Error ? error.message : "Invalid timestamp.",
        cueId: String(index),
      });
    }
  });

  return {
    document: {
      type: "srt",
      cues,
    },
    issues,
  };
}
