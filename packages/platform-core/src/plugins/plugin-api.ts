import type { CommandDefinition } from "../commands/create-command";
import type { PlatformContributions } from "../contributions/descriptors";
import type {
  ContributionReader,
  ExtensionContribution,
  ExtensionPoint,
} from "../extensions/extension-point";
import type { Disposable } from "../lifecycle/disposable";
import type { ServiceContribution } from "../services/provider";
import type { ServiceToken } from "../services/tokens";
import type { SettingDefinition } from "../settings/settings-registry";

export interface PluginToken {
  readonly kind: "plugin";
  readonly id: string;
  readonly version?: string;
  readonly optional?: boolean;
}

export type DependencyToken = PluginToken | ServiceToken<unknown> | ExtensionPoint<unknown>;

export interface PluginSetupContext {
  get<T>(token: ServiceToken<T>): T;
  execute<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    input: TInput,
    options?: { readonly signal?: AbortSignal },
  ): Promise<TResult>;
  readonly contributions: ContributionReader;
  add(disposable: Disposable): void;
  onDispose(callback: () => void): void;
}

export interface PluginDefinition {
  readonly id: string;
  readonly version?: string;
  readonly displayName?: string;
  readonly requires?: readonly DependencyToken[];
  readonly extensionPoints?: readonly ExtensionPoint<unknown>[];
  readonly contributions?: readonly ExtensionContribution<unknown>[];
  readonly services?: readonly ServiceContribution<unknown>[];
  readonly commands?: readonly CommandDefinition<unknown, unknown>[];
  readonly settings?: readonly SettingDefinition<unknown>[];
  readonly tools?: readonly unknown[];
  readonly workspaceEditors?: readonly unknown[];
  readonly contributes?: PlatformContributions;
  readonly setup?: (context: PluginSetupContext) => void | Disposable | Promise<void | Disposable>;
}

export function createPlugin<const TPlugin extends PluginDefinition>(definition: TPlugin): TPlugin {
  return definition;
}

export function createPluginToken(id: string, options: { version?: string; optional?: boolean } = {}): PluginToken {
  return { kind: "plugin", id, ...options };
}
