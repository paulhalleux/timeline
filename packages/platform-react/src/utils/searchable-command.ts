import type { CommandDefinition, MessageService } from "@ptl/platform-core";
import { formatLocalizedText } from "./format-command";

export interface SearchableCommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  readonly keywords: readonly string[];
  readonly definition: CommandDefinition<unknown, unknown>;
}

export async function toSearchableCommand(
  messages: MessageService,
  command: CommandDefinition<unknown, unknown>,
): Promise<SearchableCommand> {
  return {
    id: command.id,
    title: await formatLocalizedText(messages, command.title),
    description: command.description ? await formatLocalizedText(messages, command.description) : undefined,
    category: command.category ? await formatLocalizedText(messages, command.category) : undefined,
    keywords: command.keywords ?? [],
    definition: command,
  };
}

export function matchesCommandQuery(command: SearchableCommand, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [command.id, command.title, command.description, command.category, ...command.keywords]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}
