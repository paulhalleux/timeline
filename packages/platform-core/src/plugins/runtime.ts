import {
  CommandRegistry,
  type CommandDefinition,
  type CommandHandler,
} from "../commands/command-registry";
import type {
  MenuContribution,
  PlatformContributions,
  ShortcutContribution,
  ToolbarContribution,
} from "../contributions/descriptors";
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

export interface PlatformCommandContribution<
  TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  command: TCommand;
  handler?: CommandHandler<TCommand> | PlatformCommandHandler<TServices>;
  menus?: readonly MenuContribution<string, TCommand>[];
  shortcuts?: readonly ShortcutContribution<TCommand>[];
  toolbars?: readonly ToolbarContribution<string, TCommand>[];
}

export type PlatformCommandHandler<
  TServices extends Record<string, unknown> = Record<string, unknown>,
> = (
  input: unknown,
  execution: Parameters<CommandHandler<CommandDefinition<any, any>>>[1],
  platform: PluginActivationContext<TServices>,
) => unknown | Promise<unknown>;

export interface PlatformPlugin<TServices extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<PluginDefinition<TServices>, "contributes" | "activate"> {
  contributions?: PlatformContributions;
  commands?: readonly PlatformCommandContribution<CommandDefinition<any, any>, TServices>[];
  activate?: PluginDefinition<TServices>["activate"];
}

export interface CreatePlatformOptions<
  TServices extends Record<string, unknown> = Record<string, unknown>,
> extends PlatformRuntimeOptions<TServices> {
  plugins?: readonly PlatformPlugin<TServices>[];
  activate?: boolean;
}

export function definePlatformPlugin<
  TServices extends Record<string, unknown> = Record<string, unknown>,
>(plugin: PlatformPlugin<TServices>): PlatformPlugin<TServices> {
  return plugin;
}

export function createPlatform<TServices extends Record<string, unknown> = Record<string, unknown>>(
  options: CreatePlatformOptions<TServices> = {},
): PlatformRuntime<TServices> {
  const runtime = new PlatformRuntime<TServices>(options);

  for (const plugin of options.plugins ?? []) {
    runtime.registerPlugin(toRuntimePlugin(plugin));
  }

  if (options.activate ?? true) {
    for (const plugin of runtime.resolveActivationOrder()) {
      void runtime.activatePlugin(plugin.id);
    }
  }

  return runtime;
}

function toRuntimePlugin<TServices extends Record<string, unknown>>(
  plugin: PlatformPlugin<TServices>,
): PluginDefinition<TServices> {
  const commandContributions = plugin.commands ?? [];

  return {
    ...plugin,
    contributes: {
      ...plugin.contributions,
      commands: [
        ...(plugin.contributions?.commands ?? []),
        ...commandContributions.map((entry) => entry.command),
      ],
      menus: [
        ...(plugin.contributions?.menus ?? []),
        ...commandContributions.flatMap((entry) => entry.menus ?? []),
      ],
      shortcuts: [
        ...(plugin.contributions?.shortcuts ?? []),
        ...commandContributions.flatMap((entry) => entry.shortcuts ?? []),
      ],
      toolbars: [
        ...(plugin.contributions?.toolbars ?? []),
        ...commandContributions.flatMap((entry) => entry.toolbars ?? []),
      ],
    },
    activate: async (context) => {
      for (const entry of commandContributions) {
        if (entry.handler) {
          context.subscriptions.add(
            context.commands.registerHandler(entry.command, (input, execution) =>
              (entry.handler as PlatformCommandHandler<TServices>)(input, execution, context),
            ),
          );
        }
      }

      return plugin.activate?.(context);
    },
  };
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
  private readonly contributions: PlatformContributions[] = [];

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

  getContributions(): PlatformContributions {
    return mergePlatformContributions(this.contributions);
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

    this.contributions.push(contributions);

    for (const command of contributions.commands ?? []) {
      this.commands.register(command);
    }

    for (const setting of contributions.settings ?? []) {
      this.settings.register(setting);
    }
  }
}

function mergePlatformContributions(
  contributions: readonly PlatformContributions[],
): PlatformContributions {
  return {
    commands: contributions.flatMap((contribution) => contribution.commands ?? []),
    menuRoots: contributions.flatMap((contribution) => contribution.menuRoots ?? []),
    menus: contributions.flatMap((contribution) => contribution.menus ?? []),
    shortcuts: contributions.flatMap((contribution) => contribution.shortcuts ?? []),
    toolbars: contributions.flatMap((contribution) => contribution.toolbars ?? []),
    settings: contributions.flatMap((contribution) => contribution.settings ?? []),
    messages: contributions.flatMap((contribution) => contribution.messages ?? []),
  };
}
