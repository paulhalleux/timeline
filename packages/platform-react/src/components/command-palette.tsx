import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@ptl/ui";
import * as React from "react";

import { usePlatform } from "../hooks/platform-provider";
import { useCommandRegistrySnapshot } from "../hooks/use-command-registry-snapshot";
import {
  matchesCommandQuery,
  toSearchableCommand,
  type SearchableCommand,
} from "../utils/searchable-command";

export interface CommandPaletteProps {
  open: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  empty?: React.ReactNode;
}

/**
 * Command palette sourced directly from `CommandRegistry#getAll()`.
 *
 * Commands with `palette === false` are hidden. Everything else is searchable
 * by title, category, description, and keywords, grouped by category.
 */
export function CommandPalette({
  open,
  query,
  onQueryChange,
  onOpenChange,
  className,
  empty = "No commands found.",
}: CommandPaletteProps) {
  const { platform } = usePlatform();
  const registeredCommands = useCommandRegistrySnapshot(platform.commands);
  const [internalQuery, setInternalQuery] = React.useState("");
  const [commands, setCommands] = React.useState<SearchableCommand[]>([]);
  const activeQuery = query ?? internalQuery;

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all(
      registeredCommands
        .filter((c) => c.palette !== false)
        .map(async (c) => toSearchableCommand(platform.i18n, c)),
    ).then((resolved) => {
      if (!cancelled) setCommands(resolved);
    });
    return () => { cancelled = true; };
  }, [platform.i18n, registeredCommands]);

  const groups = React.useMemo(() => {
    const filtered = commands.filter((c) => matchesCommandQuery(c, activeQuery));
    const map = new Map<string, SearchableCommand[]>();
    for (const command of filtered) {
      const key = command.category || "General";
      const list = map.get(key) ?? [];
      list.push(command);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [commands, activeQuery]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className={className}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search commands…"
          onValueChange={(value) => {
            setInternalQuery(value);
            onQueryChange?.(value);
          }}
          value={activeQuery}
        />
        <CommandList>
          <CommandEmpty>{empty}</CommandEmpty>
          {groups.map(([category, items], index) => (
            <React.Fragment key={category}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={category}>
                {items.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={`${command.title} ${command.id}`}
                    onSelect={() => {
                      void platform.commands.execute(command.definition, undefined);
                      onOpenChange?.(false);
                    }}
                  >
                    {command.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
