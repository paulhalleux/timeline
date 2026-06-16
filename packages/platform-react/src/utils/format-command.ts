import type { CommandDefinition, I18nService, LocalizedText } from "@ptl/platform-core";

export function formatLocalizedTextSync(text: LocalizedText): string {
  return typeof text === "string" ? text : text.defaultMessage;
}

export async function formatLocalizedText(i18n: I18nService, text: LocalizedText) {
  return typeof text === "string" ? text : i18n.format(text, {});
}

export function formatCommandTitleSync(command: CommandDefinition<any, any>): string {
  return formatLocalizedTextSync(command.title);
}

export function formatCommandDescriptionSync(command: CommandDefinition<any, any>): string {
  return command.description ? formatLocalizedTextSync(command.description) : "";
}
