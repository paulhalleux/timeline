import type { Disposable } from "../lifecycle/disposable";
import type { LocalizedText, MessageParams } from "../text/messages";

export interface MessageDefinition<TParams extends MessageParams = MessageParams> {
  readonly kind: "message";
  readonly id: string;
  readonly defaultMessage: string;
  readonly description?: string;
  readonly __params?: (params: TParams) => TParams;
}

export interface TranslationBundle {
  readonly kind: "translation-bundle";
  readonly locale: string;
  readonly messages: Readonly<Record<string, string>>;
}

export interface MessageReader {
  format<TParams extends MessageParams>(message: LocalizedText | MessageDefinition<TParams>, params?: TParams): string;
  getLocale(): string;
  subscribe(listener: (locale: string) => void): Disposable;
}

export interface MessageService extends MessageReader {
  setLocale(locale: string): void;
}

export function createMessage<TParams extends MessageParams = MessageParams>(
  definition: Omit<MessageDefinition<TParams>, "kind">,
): MessageDefinition<TParams> {
  return { kind: "message", ...definition };
}

export function createTranslationBundle(definition: Omit<TranslationBundle, "kind">): TranslationBundle {
  return { kind: "translation-bundle", ...definition };
}
