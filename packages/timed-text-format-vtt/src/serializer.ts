import type { SerializeOptions } from "@ptl/timed-text-core";

import { stringifyVttSettings } from "./settings";
import { formatVttTimestamp } from "./time";
import type { VttDocument } from "./types";
import { validateVtt } from "./validation";

export function serializeVtt(
  document: VttDocument,
  options: SerializeOptions = {},
) {
  const newline = options.newline ?? "\n";
  const lines: string[] = [document.header ?? "WEBVTT", ""];

  for (const region of document.regions) {
    lines.push("REGION");
    for (const [key, value] of Object.entries(region.settings)) {
      lines.push(`${key}=${value}`);
    }
    lines.push("");
  }

  for (const style of document.styles) {
    lines.push("STYLE");
    lines.push(style.css);
    lines.push("");
  }

  for (const comment of document.comments) {
    lines.push(`NOTE ${comment.text}`);
    lines.push("");
  }

  for (const cue of document.cues) {
    if (cue.identifier) lines.push(cue.identifier);

    let timingLine = `${formatVttTimestamp(cue.startMs)} --> ${formatVttTimestamp(cue.endMs)}`;
    if (cue.settings) {
      const settings = stringifyVttSettings(cue.settings);
      if (settings) timingLine += ` ${settings}`;
    }
    lines.push(timingLine);
    lines.push(cue.payload);
    lines.push("");
  }

  return {
    content: lines.join(newline),
    issues: validateVtt(document),
  };
}
