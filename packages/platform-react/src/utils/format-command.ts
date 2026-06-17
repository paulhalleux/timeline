import type { LocalizedText, MessageParams, MessageService } from "@ptl/platform-core";

export async function formatLocalizedText(messages: MessageService, text: LocalizedText) {
  return typeof text === "string" ? text : messages.format(text, {} as MessageParams);
}

export function formatCommandTitleSync(command: { readonly title: LocalizedText }): string {
  return typeof command.title === "string" ? command.title : command.title.defaultMessage;
}
