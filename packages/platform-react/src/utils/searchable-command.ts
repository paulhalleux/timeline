import type { CommandDefinition, I18nService } from "@ptl/platform-core";

import { formatLocalizedText } from "./format-command";

export interface SearchableCommand {
  id: string;
  title: string;
  category: string;
  description: string;
  keywords: readonly string[];
  definition: CommandDefinition<any, any>;
}

export async function toSearchableCommand(
  i18n: I18nService,
  command: CommandDefinition<any, any>,
): Promise<SearchableCommand> {
  return {
    id: command.id,
    title: await formatLocalizedText(i18n, command.title),
    category: command.category ? await formatLocalizedText(i18n, command.category) : "",
    description: command.description ? await formatLocalizedText(i18n, command.description) : "",
    keywords: command.keywords ?? [],
    definition: command,
  };
}

export function matchesCommandQuery(command: SearchableCommand, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [command.id, command.title, command.category, command.description, ...command.keywords]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}
