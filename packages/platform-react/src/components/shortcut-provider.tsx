import { isContributionEnabled, isContributionVisible, type CommandDefinition, type ShortcutContribution } from "@ptl/platform-core";
import { useHotkeys, type RegisterableHotkey } from "@tanstack/react-hotkeys";
import * as React from "react";

import { usePlatform } from "../hooks/platform-provider";
import { findShortcutConflicts, type ShortcutConflict } from "../utils/shortcut-conflicts";

const EMPTY_SHORTCUTS: readonly ShortcutContribution<CommandDefinition<unknown, unknown>, unknown>[] = [];

export interface ShortcutProviderProps<TContext = unknown> {
  context: TContext;
  children: React.ReactNode;
  target?: Document | HTMLElement | null;
  protectTextInput?: boolean;
  onConflict?: (conflict: ShortcutConflict<TContext>) => void;
}

/**
 * Binds platform shortcut contributions through TanStack Hotkeys.
 *
 * This component converts platform contribution descriptors into TanStack
 * registrations, preserving dynamic contribution arrays without violating the
 * rules of hooks. Text inputs are protected by default through TanStack's
 * `ignoreInputs` option.
 *
 * @example
 * ```tsx
 * <ShortcutProvider context={whenContext}>
 *   <Editor />
 * </ShortcutProvider>
 * ```
 */
export function ShortcutProvider<TContext = unknown>({
  context,
  children,
  target,
  protectTextInput = true,
  onConflict,
}: ShortcutProviderProps<TContext>) {
  const { platform, contributions: platformContributions } = usePlatform<TContext>();
  const contributions = platformContributions.shortcuts ?? EMPTY_SHORTCUTS;

  React.useEffect(() => {
    if (!onConflict) {
      return;
    }

    for (const conflict of findShortcutConflicts(contributions)) {
      onConflict(conflict);
    }
  }, [contributions, onConflict]);

  useHotkeys(
    contributions.map((contribution) => ({
      hotkey: contribution.shortcut as RegisterableHotkey,
      callback: () => {
        if (
          !isContributionVisible(contribution, context) ||
          !isContributionEnabled(contribution, context)
        ) {
          return;
        }

        void platform.commands.execute(contribution.command, undefined);
      },
      options: {
        ignoreInputs: protectTextInput,
        preventDefault: contribution.preventDefault,
        target,
      },
    })),
  );

  return <>{children}</>;
}
