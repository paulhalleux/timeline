import type { Disposable } from "../lifecycle/disposable";

export type SettingScope = "application" | "profile" | "workspace" | "resource";
export type SettingControl = "checkbox" | "number" | "text" | "select";
export type SettingValue = string | number | boolean | null | readonly SettingValue[] | { readonly [key: string]: SettingValue };

export interface SettingDefinition<TValue = SettingValue> {
  readonly kind: "setting";
  readonly id: string;
  readonly defaultValue: TValue;
  readonly scope?: SettingScope;
  readonly title?: string;
  readonly description?: string;
  readonly control?: SettingControl;
}

export interface SettingsStorage {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}

export interface SettingsReader {
  get<T>(setting: SettingDefinition<T>): T;
  getDefinitions(): readonly SettingDefinition<unknown>[];
  subscribe<T>(setting: SettingDefinition<T>, listener: (value: T) => void): Disposable;
}

export interface SettingsService extends SettingsReader {
  set<T>(setting: SettingDefinition<T>, value: T): Promise<void>;
  reset<T>(setting: SettingDefinition<T>): Promise<void>;
}

export function createSetting<const TSetting extends SettingDefinition<unknown>>(
  definition: Omit<TSetting, "kind">,
): TSetting {
  return { kind: "setting", ...definition } as TSetting;
}
