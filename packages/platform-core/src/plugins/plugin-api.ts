import type { CommandDefinition } from "../commands/create-command";
import type {
  MenuContribution,
  MenuRootContribution,
  ShortcutContribution,
  ToolbarContribution,
} from "../contributions/descriptors";
import type {
  ContributionReader,
  ExtensionContribution,
  ExtensionPoint,
} from "../extensions/extension-point";
import type { Disposable } from "../lifecycle/disposable";
import type {
  MessageDefinition,
  MessageReader,
  TranslationBundle,
} from "../messages/message-service";
import type { ServiceProvider } from "../services/provider";
import type { ServiceToken } from "../services/tokens";
import type { SettingDefinition, SettingsReader } from "../settings/settings-registry";
import type { LocalizedText } from "../text/messages";

export interface PluginToken {
  readonly kind: "plugin";
  readonly id: string;
  readonly version?: string;
  readonly optional?: boolean;
}

export type DependencyRequirement = PluginToken | ServiceToken<unknown> | ExtensionPoint<unknown>;

export interface PluginSetupContext {
  get<T>(token: ServiceToken<T>): T;
  execute<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    input: TInput,
    options?: { readonly signal?: AbortSignal },
  ): Promise<TResult>;
  readonly contributions: ContributionReader;
  readonly settings: SettingsReader;
  readonly messages: MessageReader;
  add(disposable: Disposable): void;
  onDispose(callback: () => void): void;
}

export type PluginSetup = (context: PluginSetupContext) => void | Disposable | Promise<void | Disposable>;

export interface PluginDefinition {
  readonly kind: "plugin";
  readonly id: string;
  readonly version?: string;
  readonly displayName?: LocalizedText;
  readonly requires?: readonly DependencyRequirement[];
  readonly extensionPoints?: readonly ExtensionPoint<unknown>[];
  readonly contributions?: readonly ExtensionContribution<unknown>[];
  readonly services?: readonly ServiceProvider<unknown>[];
  readonly commands?: readonly CommandDefinition<unknown, unknown>[];
  readonly settings?: readonly SettingDefinition<unknown>[];
  readonly messages?: readonly MessageDefinition[];
  readonly translations?: readonly TranslationBundle[];
  readonly menuRoots?: readonly MenuRootContribution[];
  readonly menus?: readonly MenuContribution[];
  readonly shortcuts?: readonly ShortcutContribution[];
  readonly toolbars?: readonly ToolbarContribution[];
  readonly setup?: PluginSetup;
}

export function createPlugin<const TPlugin extends Omit<PluginDefinition, "kind">>(
  definition: TPlugin,
): TPlugin & { readonly kind: "plugin" } {
  return Object.freeze({ kind: "plugin" as const, ...definition });
}

export function createPluginToken(
  id: string,
  options: { readonly version?: string; readonly optional?: boolean } = {},
): PluginToken {
  return { kind: "plugin", id, ...options };
}
