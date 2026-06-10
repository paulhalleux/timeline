import type { SerializeOptions } from "@ptl/timed-text-core";

import { formatSrtTimestamp } from "./time";
import type { SrtDocument } from "./types";
import { validateSrt } from "./validation";

export function serializeSrt(
  document: SrtDocument,
  options: SerializeOptions = {},
) {
  const newline = options.newline ?? "\n";
  const lines: string[] = [];

  document.cues.forEach((cue, index) => {
    lines.push(String(index + 1));
    lines.push(
      `${formatSrtTimestamp(cue.startMs)} --> ${formatSrtTimestamp(cue.endMs)}`,
    );
    lines.push(...cue.lines);
    lines.push("");
  });

  return {
    content: lines.join(newline),
    issues: validateSrt(document),
  };
}
