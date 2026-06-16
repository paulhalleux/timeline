import { CommandRegistry } from "../commands/command-registry";
import type { PlatformContributions } from "../contributions/descriptors";
import { DisposableStore, type Disposable } from "../lifecycle/disposable";
import { ExtensionPointRegistry } from "../extensions/extension-point-registry";
import { I18nService } from "../i18n/i18n-service";
import { ServiceRegistry } from "../services/service-registry";
import { SettingsRegistry } from "../settings/settings-registry";

export type PluginDependency =
  | { type: "plugin"; id: string; version?: string; optional?: boolean }
  | { type: "service"; id: string; version?: string; optional?: boolean }
  | { type: "extension-point"; id: string; version?: string; optional?: boolean };

export interface PluginDefinition<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TContext = unknown,
> {
  id: string;
  version?: string;
  displayName?: string;
  dependencies?: readonly PluginDependency[];
  contributes?: PlatformContributions<TContext>;
  activate?: (
    context: PluginActivationContext<TServices>,
  ) => void | Disposable | Promise<void | Disposable>;
  deactivate?: () => void | Promise<void>;
}

/**
 * Services and registries exposed while a plugin activates.
 *
 * Add every handler, subscription, and temporary resource to `subscriptions`
 * so platform deactivation can cleanly unwind the plugin.
 */
export interface PluginActivationContext<
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly plugin: PluginDefinition<TServices>;
  readonly subscriptions: DisposableStore;
  readonly commands: CommandRegistry;
  readonly settings: SettingsRegistry;
  readonly i18n: I18nService;
  readonly services: ServiceRegistry<TServices>;
  readonly extensionPoints: ExtensionPointRegistry;
}

export function definePlugin<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TContext = unknown,
>(definition: PluginDefinition<TServices, TContext>): PluginDefinition<TServices, TContext> {
  return definition;
}
