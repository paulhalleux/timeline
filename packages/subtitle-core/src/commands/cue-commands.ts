import {
  defineCommand,
  type CommandRegistry,
  type MenuContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";

import {
  createEditorCue,
  deleteEditorCue,
  insertEditorCue,
  mergeEditorCues,
  replaceEditorCueRange,
  splitEditorCue,
  type CreateEditorCueInput,
  updateEditorCue,
  updateEditorCueTiming,
  type EditorTimedTextCue,
  type MergeEditorCuesOptions,
  type SplitEditorCueOptions,
} from "@ptl/timed-text-core";
import type { TimedTextCommandContext } from "./context";
import { commitTimedTextCommandResult, requireCommandInput } from "./helpers";
import { TIMED_TEXT_COMMAND_CATEGORY, TIMED_TEXT_COMMAND_SOURCE } from "./metadata";

export type CreateCueCommandInput = CreateEditorCueInput;

export interface InsertCueCommandInput {
  trackId: string;
  cue: EditorTimedTextCue;
  index?: number;
}

export interface DeleteCueCommandInput {
  cueId: string;
}

export interface UpdateCueTextCommandInput {
  cueId: string;
  text: string;
}

export interface UpdateCueTimingCommandInput {
  cueId: string;
  startMs: number;
  endMs: number;
}

export interface ReplaceCueRangeCommandInput {
  trackId: string;
  cueIds: readonly string[];
  cues: readonly EditorTimedTextCue[];
  index?: number;
}

export interface SplitCueCommandInput extends Omit<SplitEditorCueOptions, "createId"> {
  cueId: string;
  atMs: number;
}

export interface MergeCuesCommandInput extends MergeEditorCuesOptions {
  cueIds: readonly string[];
}

/**
 * Command definitions for cue operations.
 *
 * These definitions are static metadata. Register handlers with
 * `registerTimedTextCueCommandHandlers` in the package that owns document
 * state, history, persistence, and collaboration.
 */
export const createCueCommand = defineCommand<
  CreateCueCommandInput,
  ReturnType<typeof createEditorCue>
>({
  id: "timedText.cue.create",
  title: "Create cue",
  category: TIMED_TEXT_COMMAND_CATEGORY,
  keywords: ["subtitle", "caption"],
});

export const insertCueCommand = defineCommand<
  InsertCueCommandInput,
  ReturnType<typeof insertEditorCue>
>({
  id: "timedText.cue.insert",
  title: "Insert cue",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const deleteCueCommand = defineCommand<
  DeleteCueCommandInput,
  ReturnType<typeof deleteEditorCue>
>({
  id: "timedText.cue.delete",
  title: "Delete cue",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const updateCueTextCommand = defineCommand<
  UpdateCueTextCommandInput,
  ReturnType<typeof updateEditorCue>
>({
  id: "timedText.cue.updateText",
  title: "Update cue text",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const updateCueTimingCommand = defineCommand<
  UpdateCueTimingCommandInput,
  ReturnType<typeof updateEditorCueTiming>
>({
  id: "timedText.cue.updateTiming",
  title: "Update cue timing",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const replaceCueRangeCommand = defineCommand<
  ReplaceCueRangeCommandInput,
  ReturnType<typeof replaceEditorCueRange>
>({
  id: "timedText.cue.replaceRange",
  title: "Replace cue range",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const splitCueCommand = defineCommand<
  SplitCueCommandInput,
  ReturnType<typeof splitEditorCue>
>({
  id: "timedText.cue.split",
  title: "Split cue",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const mergeCuesCommand = defineCommand<
  MergeCuesCommandInput,
  ReturnType<typeof mergeEditorCues>
>({
  id: "timedText.cue.merge",
  title: "Merge cues",
  category: TIMED_TEXT_COMMAND_CATEGORY,
});

export const cueCommands = {
  createCue: createCueCommand,
  insertCue: insertCueCommand,
  deleteCue: deleteCueCommand,
  updateCueText: updateCueTextCommand,
  updateCueTiming: updateCueTimingCommand,
  replaceCueRange: replaceCueRangeCommand,
  splitCue: splitCueCommand,
  mergeCues: mergeCuesCommand,
};

export const defaultCueCommands = Object.values(cueCommands);

export const defaultCueMenuContributions: MenuContribution[] = [
  { menu: "main.edit", command: deleteCueCommand, group: "Edit", order: 30 },
  { menu: "main.cue", command: splitCueCommand, group: "Cue", order: 20 },
  { menu: "main.cue", command: mergeCuesCommand, group: "Cue", order: 30 },
];

export const defaultCueShortcutContributions: ShortcutContribution[] = [
  {
    command: deleteCueCommand,
    shortcut: "Delete",
    preventDefault: true,
    source: TIMED_TEXT_COMMAND_SOURCE,
  },
  {
    command: splitCueCommand,
    shortcut: "Mod+Shift+S",
    preventDefault: true,
    source: TIMED_TEXT_COMMAND_SOURCE,
  },
  {
    command: mergeCuesCommand,
    shortcut: "Mod+M",
    preventDefault: true,
    source: TIMED_TEXT_COMMAND_SOURCE,
  },
];

export function registerTimedTextCueCommandHandlers(
  registry: CommandRegistry,
  context: TimedTextCommandContext,
) {
  return [
    registry.registerHandler(createCueCommand, (input) =>
      createEditorCue(requireCommandInput(createCueCommand.id, input), context.createId),
    ),
    registry.registerHandler(insertCueCommand, (input) => {
      const payload = requireCommandInput(insertCueCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        insertEditorCue(context.getDocument(), payload.trackId, payload.cue, payload.index),
        "Insert cue",
      );
    }),
    registry.registerHandler(deleteCueCommand, (input) => {
      const payload = requireCommandInput(deleteCueCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        deleteEditorCue(context.getDocument(), payload.cueId),
        "Delete cue",
      );
    }),
    registry.registerHandler(updateCueTextCommand, (input) => {
      const payload = requireCommandInput(updateCueTextCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        updateEditorCue(context.getDocument(), payload.cueId, { text: payload.text }),
        "Update cue text",
      );
    }),
    registry.registerHandler(updateCueTimingCommand, (input) => {
      const payload = requireCommandInput(updateCueTimingCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        updateEditorCueTiming(context.getDocument(), payload.cueId, payload.startMs, payload.endMs),
        "Update cue timing",
      );
    }),
    registry.registerHandler(replaceCueRangeCommand, (input) => {
      const payload = requireCommandInput(replaceCueRangeCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        replaceEditorCueRange(
          context.getDocument(),
          payload.trackId,
          payload.cueIds,
          payload.cues,
          payload.index,
        ),
        "Replace cue range",
      );
    }),
    registry.registerHandler(splitCueCommand, (input) => {
      const payload = requireCommandInput(splitCueCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        splitEditorCue(context.getDocument(), payload.cueId, payload.atMs, {
          createId: context.createId,
          firstText: payload.firstText,
          secondCueId: payload.secondCueId,
          secondText: payload.secondText,
          textDistribution: payload.textDistribution,
        }),
        "Split cue",
      );
    }),
    registry.registerHandler(mergeCuesCommand, (input) => {
      const payload = requireCommandInput(mergeCuesCommand.id, input);
      return commitTimedTextCommandResult(
        context,
        mergeEditorCues(context.getDocument(), payload.cueIds, {
          separator: payload.separator,
          textCombination: payload.textCombination,
        }),
        "Merge cues",
      );
    }),
  ];
}
