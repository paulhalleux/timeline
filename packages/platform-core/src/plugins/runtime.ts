import { CommandRegistry } from "../commands/command-registry";
import type { PlatformContributions } from "../contributions/descriptors";
import { DisposableStore } from "../lifecycle/disposable";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import { ExtensionPointRegistry } from "../extensions/extension-point-registry";
import { I18nService } from "../i18n/i18n-service";
import type { PluginActivationContext, PluginDefinition } from "./definition";
import { resolvePluginOrder } from "./resolver";
import { ServiceRegistry } from "../services/service-registry";
import { SettingsRegistry } from "../settings/settings-registry";

export interface PlatformRuntimeOptions<TServices extends Record<string, unknown>> {
  services?: ServiceRegistry<TServices>;
  commands?: CommandRegistry;
  settings?: SettingsRegistry;
  i18n?: I18nService;
  extensionPoints?: ExtensionPointRegistry;
}

export function createPlatformRuntime<
  TServices extends Record<string, unknown> = Record<string, unknown>,
>(options: PlatformRuntimeOptions<TServices> = {}): PlatformRuntime<TServices> {
  return new PlatformRuntime(options);
}

/**
 * Composes platform services, static contributions, and lazy plugin handlers.
 *
 * Registering a plugin records its static command/settings metadata
 * immediately. Activation then registers executable handlers and any temporary
 * resources into a disposable store owned by the plugin.
 */
export class PlatformRuntime<TServices extends Record<string, unknown> = Record<string, unknown>> {
  readonly services: ServiceRegistry<TServices>;
  readonly commands: CommandRegistry;
  readonly settings: SettingsRegistry;
  readonly i18n: I18nService;
  readonly extensionPoints: ExtensionPointRegistry;

  private readonly plugins = new Map<string, PluginDefinition<TServices>>();
  private readonly pluginDisposables = new Map<string, DisposableStore>();

  constructor(options: PlatformRuntimeOptions<TServices> = {}) {
    this.services = options.services ?? new ServiceRegistry<TServices>();
    this.commands = options.commands ?? new CommandRegistry();
    this.settings = options.settings ?? new SettingsRegistry();
    this.i18n = options.i18n ?? new I18nService();
    this.extensionPoints = options.extensionPoints ?? new ExtensionPointRegistry();
  }

  registerPlugin(plugin: PluginDefinition<TServices>): void {
    if (this.plugins.has(plugin.id)) {
      throw new PlatformError({
        code: platformErrorCodes.duplicatePlugin,
        message: `Plugin "${plugin.id}" is already registered`,
        details: { pluginId: plugin.id },
      });
    }

    this.plugins.set(plugin.id, plugin);
    this.registerStaticContributions(plugin);
  }

  resolveActivationOrder(): PluginDefinition<TServices>[] {
    return resolvePluginOrder([...this.plugins.values()], {
      services: this.services,
      extensionPoints: this.extensionPoints,
    });
  }

  getPlugins(): PluginDefinition<TServices>[] {
    return [...this.plugins.values()];
  }

  async activatePlugin(pluginId: string): Promise<void> {
    if (this.pluginDisposables.has(pluginId)) {
      return;
    }

    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PlatformError({
        code: platformErrorCodes.pluginMissing,
        message: `Plugin "${pluginId}" is not registered`,
        details: { pluginId },
      });
    }

    for (const dependency of plugin.dependencies ?? []) {
      if (dependency.type === "plugin" && !dependency.optional) {
        await this.activatePlugin(dependency.id);
      }
    }

    const subscriptions = new DisposableStore();
    this.pluginDisposables.set(plugin.id, subscriptions);

    const context: PluginActivationContext<TServices> = {
      plugin,
      subscriptions,
      commands: this.commands,
      settings: this.settings,
      i18n: this.i18n,
      services: this.services,
      extensionPoints: this.extensionPoints,
    };

    try {
      const disposable = await plugin.activate?.(context);
      if (disposable) {
        subscriptions.add(disposable);
      }
    } catch (cause) {
      this.pluginDisposables.delete(plugin.id);
      subscriptions.dispose();
      throw new PlatformError({
        code: platformErrorCodes.pluginActivationFailed,
        message: `Plugin "${plugin.id}" failed during activation`,
        details: { pluginId: plugin.id },
        cause,
      });
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const subscriptions = this.pluginDisposables.get(pluginId);

    if (!subscriptions) {
      return;
    }

    this.pluginDisposables.delete(pluginId);
    await plugin?.deactivate?.();
    subscriptions.dispose();
  }

  private registerStaticContributions(plugin: PluginDefinition<TServices>): void {
    const contributions: PlatformContributions | undefined = plugin.contributes;
    if (!contributions) {
      return;
    }

    for (const command of contributions.commands ?? []) {
      this.commands.register(command);
    }

    for (const setting of contributions.settings ?? []) {
      this.settings.register(setting);
    }
  }
}
