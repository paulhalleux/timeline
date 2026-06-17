import {
  createCommand,
  type CommandDefinition,
  type Disposable,
  type MenuContribution,
} from "@ptl/platform-core";

import {
  adjustEditorGaps,
  fixEditorOverlaps,
  scaleEditorCues,
  shiftEditorCues,
  snapEditorCuesToFrames,
  sortEditorCuesByTime,
  type AdjustGapMode,
  type EditorOperationResult,
  type FixOverlapMode,
} from "@ptl/timed-text-core";
import type { TimedTextCommandContext } from "./context";
import {
  commitTimedTextCommandResult,
  documentCommandResult,
  requireCommandInput,
} from "./helpers";
import { TIMED_TEXT_COMMAND_CATEGORY } from "./metadata";

interface CommandRegistrar {
  registerHandler<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    handler: (input: TInput) => TResult | Promise<TResult>,
  ): Disposable;
}

export interface ShiftCuesCommandInput {
  offsetMs: number;
  cueIds?: readonly string[];
}

export interface ScaleCuesCommandInput {
  factor: number;
  anchorMs?: number;
}

export interface SnapCuesToFramesCommandInput {
  frameRate: number;
}

export interface FixOverlapsCommandInput {
  mode?: FixOverlapMode;
  prioritizeIds?: readonly string[];
}

export interface AdjustGapsCommandInput {
  gapMs: number;
  mode?: AdjustGapMode;
}

type TimedTextDocumentCommandResult = EditorOperationResult<undefined>;

export const shiftCuesCommand = createCommand<
  ShiftCuesCommandInput,
  TimedTextDocumentCommandResult
>({
  id: "timedText.cues.shift",
  title: "Shift cues",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const scaleCuesCommand = createCommand<
  ScaleCuesCommandInput,
  TimedTextDocumentCommandResult
>({
  id: "timedText.cues.scale",
  title: "Scale cues",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const snapCuesToFramesCommand = createCommand<
  SnapCuesToFramesCommandInput,
  TimedTextDocumentCommandResult
>({
  id: "timedText.cues.snapToFrames",
  title: "Snap cues to frames",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const fixOverlapsCommand = createCommand<
  FixOverlapsCommandInput,
  TimedTextDocumentCommandResult
>({
  id: "timedText.cues.fixOverlaps",
  title: "Fix overlaps",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const adjustGapsCommand = createCommand<
  AdjustGapsCommandInput,
  TimedTextDocumentCommandResult
>({
  id: "timedText.cues.adjustGaps",
  title: "Adjust gaps",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const sortCuesByTimeCommand = createCommand<void, TimedTextDocumentCommandResult>({
  id: "timedText.cues.sortByTime",
  title: "Sort cues by time",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const timingCommands = {
  shiftCues: shiftCuesCommand,
  scaleCues: scaleCuesCommand,
  snapCuesToFrames: snapCuesToFramesCommand,
  fixOverlaps: fixOverlapsCommand,
  adjustGaps: adjustGapsCommand,
  sortCuesByTime: sortCuesByTimeCommand,
};

export const defaultTimingCommands = Object.values(timingCommands);

export const defaultTimingMenuContributions: MenuContribution[] = [
  { menu: "main.timing", command: shiftCuesCommand, group: "Timing", order: 10 },
  { menu: "main.timing", command: scaleCuesCommand, group: "Timing", order: 20 },
  {
    menu: "main.timing",
    command: snapCuesToFramesCommand,
    group: "Timing",
    order: 30,
  },
  { menu: "main.timing", command: fixOverlapsCommand, group: "Timing", order: 40 },
  { menu: "main.timing", command: adjustGapsCommand, group: "Timing", order: 50 },
  {
    menu: "main.timing",
    command: sortCuesByTimeCommand,
    group: "Timing",
    order: 60,
  },
];

export function registerTimedTextTimingCommandHandlers(
  registry: CommandRegistrar,
  context: TimedTextCommandContext,
) {
  return [
    registry.registerHandler(shiftCuesCommand, (input) => {
      const payload = requireCommandInput(shiftCuesCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        documentCommandResult(
          shiftEditorCues(context.getDocument(), payload.offsetMs, payload.cueIds),
        ),
        "Shift cues",
      );
    }),
    registry.registerHandler(scaleCuesCommand, (input) => {
      const payload = requireCommandInput(scaleCuesCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        documentCommandResult(
          scaleEditorCues(context.getDocument(), payload.factor, payload.anchorMs),
        ),
        "Scale cues",
      );
    }),
    registry.registerHandler(snapCuesToFramesCommand, (input) => {
      const payload = requireCommandInput(snapCuesToFramesCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        documentCommandResult(snapEditorCuesToFrames(context.getDocument(), payload.frameRate)),
        "Snap cues to frames",
      );
    }),
    registry.registerHandler(fixOverlapsCommand, (input) => {
      const payload = requireCommandInput(fixOverlapsCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        documentCommandResult(
          fixEditorOverlaps(context.getDocument(), payload.mode, payload.prioritizeIds),
        ),
        "Fix overlaps",
      );
    }),
    registry.registerHandler(adjustGapsCommand, (input) => {
      const payload = requireCommandInput(adjustGapsCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        documentCommandResult(adjustEditorGaps(context.getDocument(), payload.gapMs, payload.mode)),
        "Adjust gaps",
      );
    }),
    registry.registerHandler(sortCuesByTimeCommand, () =>
      commitTimedTextCommandResult(
        context,
        documentCommandResult(sortEditorCuesByTime(context.getDocument())),
        "Sort cues by time",
      ),
    ),
  ];
}
