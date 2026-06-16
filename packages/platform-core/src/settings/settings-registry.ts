import { disposable, type Disposable } from "../lifecycle/disposable";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import type { StandardSchemaLike } from "../validation/schema";
import { validateSchema } from "../validation/schema";
import type { LocalizedText } from "../text/messages";

export type SettingScope = "user" | "project" | "session";
export type SettingControl = "checkbox" | "number" | "text" | "select";

export interface SettingDefinition<TValue> {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  scope: SettingScope;
  schema: StandardSchemaLike<unknown, TValue>;
  defaultValue: TValue;
  category?: string;
  ui?: {
    control: SettingControl;
    min?: number;
    max?: number;
    options?: readonly { label: LocalizedText; value: TValue }[];
  };
}

/**
 * Defines reusable typed settings that plugins can contribute.
 *
 * The schema validates runtime values while the generic value type keeps calls
 * to `get` and `set` type-safe for consumers.
 */
export type SettingValue<TSetting> =
  TSetting extends SettingDefinition<infer TValue> ? TValue : never;

export function defineSetting<TValue>(
  definition: SettingDefinition<TValue>,
): SettingDefinition<TValue> {
  return definition;
}

export class SettingsRegistry {
  private readonly definitions = new Map<string, SettingDefinition<any>>();
  private readonly values = new Map<string, unknown>();

  register<TSetting extends SettingDefinition<any>>(setting: TSetting): Disposable {
    if (this.definitions.has(setting.id)) {
      throw new PlatformError({
        code: platformErrorCodes.settingAlreadyRegistered,
        message: `Setting "${setting.id}" is already registered`,
        details: { settingId: setting.id },
      });
    }

    this.definitions.set(setting.id, setting);

    return disposable(() => {
      if (this.definitions.get(setting.id) === setting) {
        this.definitions.delete(setting.id);
        this.values.delete(setting.id);
      }
    });
  }

  get<TSetting extends SettingDefinition<any>>(setting: TSetting): SettingValue<TSetting> {
    if (this.values.has(setting.id)) {
      return this.values.get(setting.id) as SettingValue<TSetting>;
    }

    return setting.defaultValue as SettingValue<TSetting>;
  }

  async set<TSetting extends SettingDefinition<any>>(
    setting: TSetting,
    value: SettingValue<TSetting>,
  ): Promise<void> {
    const validatedValue = await validateSchema(setting.schema, value);
    this.values.set(setting.id, validatedValue);
  }

  getAll(): SettingDefinition<any>[] {
    return [...this.definitions.values()];
  }
}
