import { disposable, type Disposable } from "../lifecycle/disposable";
import { TypedEventEmitter } from "../events/typed-event-emitter";
import type { MessageDescriptor, MessageParams } from "../text/messages";
import { validateSchema } from "../validation/schema";

export type TranslationBundle = Record<string, string>;

export interface I18nEvents {
  localeChanged: { locale: string };
}

/**
 * Runtime formatter for message descriptors and plugin-provided bundles.
 *
 * UI locale lives here rather than in subtitle document metadata, because the
 * editor chrome language and the authored subtitle language are separate
 * concerns.
 */
export class I18nService {
  private readonly bundles = new Map<string, TranslationBundle[]>();
  private readonly events = new TypedEventEmitter<I18nEvents>();
  private locale: string;

  constructor(locale = "en") {
    this.locale = locale;
  }

  onLocaleChanged(listener: (event: { locale: string }) => void): Disposable {
    return this.events.on("localeChanged", listener);
  }

  getLocale(): string {
    return this.locale;
  }

  setLocale(locale: string): void {
    if (this.locale === locale) {
      return;
    }

    this.locale = locale;
    this.events.emit("localeChanged", { locale });
  }

  registerBundle(locale: string, bundle: TranslationBundle): Disposable {
    const bundles = this.bundles.get(locale) ?? [];
    bundles.push(bundle);
    this.bundles.set(locale, bundles);

    return disposable(() => {
      const current = this.bundles.get(locale);
      if (!current) {
        return;
      }

      const index = current.indexOf(bundle);
      if (index !== -1) {
        current.splice(index, 1);
      }
    });
  }

  async format<TParams extends MessageParams>(
    message: MessageDescriptor<TParams>,
    params: TParams,
  ): Promise<string> {
    const validatedParams = message.params ? await validateSchema(message.params, params) : params;
    const template = this.resolveMessage(message);

    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = validatedParams[key];
      if (typeof value === "number") {
        return new Intl.NumberFormat(this.locale).format(value);
      }

      if (value instanceof Date) {
        return new Intl.DateTimeFormat(this.locale).format(value);
      }

      return String(value ?? "");
    });
  }

  private resolveMessage<TParams extends MessageParams>(
    message: MessageDescriptor<TParams>,
  ): string {
    const bundles = this.bundles.get(this.locale) ?? [];

    for (let index = bundles.length - 1; index >= 0; index -= 1) {
      const translated = bundles[index][message.id];
      if (translated !== undefined) {
        return translated;
      }
    }

    return message.defaultMessage;
  }
}
