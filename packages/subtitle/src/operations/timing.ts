import type { SubtitleDocument } from "../types";
import { time } from "../utils";

/**
 * Fix overlapping cues by trimming or removing them.
 *
 * In "trim" mode, the end time of the earlier cue is adjusted to match the start time of the next cue.
 * In "remove" mode, the later cue is removed entirely.
 *
 * This function assumes cues are sorted by start time. If not, it will sort them first.
 *
 * @param doc The subtitle document to process.
 * @param mode The mode to use for fixing overlaps: "trim" or "remove".
 * @returns A new subtitle document with overlaps fixed.
 */
export function fixOverlaps<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  mode: "trim" | "remove" = "trim",
): SubtitleDocument<TFormat, TMetadata> {
  const sortedCues = [...doc.cues].sort((a, b) => a.start.ms - b.start.ms);
  const toRemove = new Set<string>();

  for (let i = 0; i < sortedCues.length - 1; i++) {
    const current = sortedCues[i];
    const next = sortedCues[i + 1];

    if (current.end.ms > next.start.ms) {
      if (mode === "remove") {
        toRemove.add(next.id);
      } else {
        sortedCues[i] = {
          ...current,
          end: time(next.start.ms),
        };
      }
    }
  }

  const newCues =
    mode === "remove"
      ? sortedCues.filter((c) => !toRemove.has(c.id))
      : sortedCues;

  return {
    ...doc,
    cues: newCues,
  };
}

/**
 * Adjust gaps between consecutive cues.
 *
 * In "extend" mode, the end time of the earlier cue is extended to create the desired gap.
 * In "shift" mode, all subsequent cues are shifted to create the desired gap.
 *
 * This function assumes cues are sorted by start time. If not, it will sort them first.
 *
 * @param doc The subtitle document to process.
 * @param gapMs The desired gap in milliseconds between cues.
 * @param mode The mode to use for adjusting gaps: "extend" or "shift".
 * @returns A new subtitle document with adjusted gaps.
 */
export function adjustGaps<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  gapMs: number,
  mode: "extend" | "shift" = "extend",
): SubtitleDocument<TFormat, TMetadata> {
  const sortedCues = [...doc.cues].sort((a, b) => a.start.ms - b.start.ms);

  for (let i = 0; i < sortedCues.length - 1; i++) {
    const current = sortedCues[i];
    const next = sortedCues[i + 1];
    const currentGap = next.start.ms - current.end.ms;

    if (currentGap !== gapMs) {
      if (mode === "extend") {
        sortedCues[i] = {
          ...current,
          end: time(next.start.ms - gapMs),
        };
      } else {
        const shiftAmount = gapMs - currentGap;
        for (let j = i + 1; j < sortedCues.length; j++) {
          const cue = sortedCues[j];
          sortedCues[j] = {
            ...cue,
            start: time(cue.start.ms + shiftAmount),
            end: time(cue.end.ms + shiftAmount),
          };
        }
      }
    }
  }

  return {
    ...doc,
    cues: sortedCues,
  };
}

/**
 * Snap cue timings to frame boundaries.
 *
 * This function rounds the start and end times of each cue to the nearest frame boundary based on the provided frame rate.
 *
 * @param doc The subtitle document to process.
 * @param frameRate The frame rate to use for snapping (e.g., 24, 30, 60).
 * @returns A new subtitle document with cue timings snapped to frame boundaries.
 */
export function snapToFrames<TFormat extends string, TMetadata>(
  doc: SubtitleDocument<TFormat, TMetadata>,
  frameRate: number,
): SubtitleDocument<TFormat, TMetadata> {
  const frameDuration = 1000 / frameRate;

  return {
    ...doc,
    cues: doc.cues.map((cue) => {
      const snappedStart =
        Math.round(cue.start.ms / frameDuration) * frameDuration;
      const snappedEnd = Math.round(cue.end.ms / frameDuration) * frameDuration;

      return {
        ...cue,
        start: time(snappedStart),
        end: time(Math.max(snappedStart + frameDuration, snappedEnd)),
      };
    }),
  };
}
