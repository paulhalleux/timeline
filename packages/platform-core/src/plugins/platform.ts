import { CommandRegistry } from "../commands/command-registry";
import type { CommandDefinition } from "../commands/create-command";
import { disposable, DisposableStore, type Disposable } from "../lifecycle/disposable";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import type {
  ContributionReader,
  ExtensionContribution,
  ExtensionPoint,
  ResolvedContribution,
} from "../extensions/extension-point";
import { validateSchema } from "../validation/schema";
import { ServiceRegistry } from "../services/service-registry";
import type { ServiceContribution } from "../services/provider";
import type { ServiceToken } from "../services/tokens";
import { SettingsRegistry } from "../settings/settings-registry";
import { I18nService } from "../i18n/i18n-service";
import type { DependencyToken, PluginDefinition, PluginSetupContext } from "./plugin-api";

export interface PlatformFactoryOptions {
  readonly plugins?: readonly PluginDefinition[];
}

export interface Platform {
  readonly commands: CommandRegistry;
  readonly settings: SettingsRegistry;
  readonly i18n: I18nService;
  readonly contributions: ContributionReader;
  start(): Promise<void>;
  dispose(): Promise<void>;
  deactivatePlugin(pluginId: string): Promise<void>;
  get<T>(token: ServiceToken<T>): T;
  execute<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    input: TInput,
    options?: { readonly signal?: AbortSignal },
  ): Promise<TResult>;
  getPlugins(): readonly PluginDefinition[];
}

interface ContributionEntry<T> extends ResolvedContribution<T> {
  readonly contribution: ExtensionContribution<T>;
}

export function createPlatform(options: PlatformFactoryOptions = {}): Platform {
  const commands = new CommandRegistry();
  const settings = new SettingsRegistry();
  const i18n = new I18nService();
  const services = new ServiceRegistry<Record<string, unknown>>();
  const plugins = [...(options.plugins ?? [])];
  const extensionPoints = new Map<string, ExtensionPoint<unknown>>();
  const contributions = new Map<string, ContributionEntry<unknown>[]>();
  const listeners = new Map<string, Set<(values: readonly unknown[]) => void>>();
  const disposables = new Map<string, DisposableStore>();
  let order: PluginDefinition[] = [];

  const reader: ContributionReader = {
    getAll(point) {
      return getEntries(point).map((entry) => entry.value);
    },
    getEntries,
    subscribe(point, listener) {
      const pointListeners = listeners.get(point.id) ?? new Set();
      pointListeners.add(listener as (values: readonly unknown[]) => void);
      listeners.set(point.id, pointListeners);
      listener(reader.getAll(point));
      return disposable(() => {
        pointListeners.delete(listener as (values: readonly unknown[]) => void);
      });
    },
  };

  function getEntries<T>(point: ExtensionPoint<T>): readonly ResolvedContribution<T>[] {
    return [...(contributions.get(point.id) ?? [])] as readonly ResolvedContribution<T>[];
  }

  function notify(point: ExtensionPoint<unknown>): void {
    for (const listener of listeners.get(point.id) ?? []) {
      listener(reader.getAll(point));
    }
  }

  function serviceGet<T>(token: ServiceToken<T>): T {
    return services.get(token.id) as T;
  }

  async function execute<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    input: TInput,
    executeOptions?: { readonly signal?: AbortSignal },
  ): Promise<TResult> {
    return commands.execute(command, input, executeOptions) as Promise<TResult>;
  }

  function missing(plugin: PluginDefinition, type: string, id: string): PlatformError {
    return new PlatformError({
      code: type === "plugin" ? platformErrorCodes.pluginMissing : `${type}.missing`,
      message: `Plugin "${plugin.id}" requires missing ${type} "${id}"`,
      details: { pluginId: plugin.id, dependencyType: type, dependencyId: id },
    });
  }

  function validateDuplicatePlugins(): void {
    const seen = new Set<string>();
    for (const plugin of plugins) {
      if (seen.has(plugin.id)) {
        throw new PlatformError({
          code: platformErrorCodes.duplicatePlugin,
          message: `Plugin "${plugin.id}" is already registered`,
          details: { pluginId: plugin.id },
        });
      }
      seen.add(plugin.id);
    }
  }

  function validateRequires(plugin: PluginDefinition): void {
    for (const requirement of plugin.requires ?? []) {
      const { kind, id } = requirement;
      if (kind === "plugin" && !plugins.some((candidate) => candidate.id === id)) {
        if (!requirement.optional) throw missing(plugin, kind, id);
      } else if (kind === "service" && !services.has(id)) {
        throw missing(plugin, kind, id);
      } else if (kind === "extension-point" && !extensionPoints.has(id)) {
        throw missing(plugin, kind, id);
      }
    }
  }

  function sortPlugins(): PluginDefinition[] {
    const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: PluginDefinition[] = [];
    const visit = (plugin: PluginDefinition): void => {
      if (visited.has(plugin.id)) return;
      if (visiting.has(plugin.id)) {
        throw new PlatformError({
          code: platformErrorCodes.dependencyCycle,
          message: `Plugin dependency cycle includes "${plugin.id}"`,
          details: { pluginId: plugin.id },
        });
      }
      visiting.add(plugin.id);
      for (const requirement of plugin.requires ?? []) {
        if (requirement.kind === "plugin") {
          const dependency = byId.get(requirement.id);
          if (dependency) visit(dependency);
        }
      }
      visiting.delete(plugin.id);
      visited.add(plugin.id);
      sorted.push(plugin);
    };
    for (const plugin of plugins) visit(plugin);
    return sorted;
  }

  async function installContribution(
    plugin: PluginDefinition,
    contribution: ExtensionContribution<unknown>,
    store: DisposableStore,
  ): Promise<void> {
    const point = extensionPoints.get(contribution.point.id);
    if (!point) throw missing(plugin, "extension-point", contribution.point.id);
    const value = point.schema ? await validateSchema(point.schema, contribution.value) : contribution.value;
    const list = contributions.get(point.id) ?? [];
    const key = point.key?.(value);
    if (key && point.duplicates !== "allow") {
      const duplicate = list.find((entry) => point.key?.(entry.value) === key);
      if (duplicate && point.duplicates !== "replace") {
        throw new PlatformError({
          code: platformErrorCodes.contributionAlreadyRegistered,
          message: `Contribution "${key}" is already registered for extension point "${point.id}"`,
          details: { pluginId: plugin.id, extensionPointId: point.id, contributionKey: key },
        });
      }
    }
    const entry: ContributionEntry<unknown> = {
      contribution,
      value,
      owner: { pluginId: plugin.id, pluginVersion: plugin.version },
    };
    list.push(entry);
    list.sort((left, right) => (point.orderBy?.(left.value) ?? 0) - (point.orderBy?.(right.value) ?? 0));
    contributions.set(point.id, list);
    notify(point);
    store.add(disposable(() => {
      const current = contributions.get(point.id) ?? [];
      contributions.set(point.id, current.filter((candidate) => candidate !== entry));
      notify(point);
    }));
  }

  async function start(): Promise<void> {
    validateDuplicatePlugins();
    order = sortPlugins();
    try {
      for (const plugin of order) {
        const store = new DisposableStore();
        disposables.set(plugin.id, store);
        for (const point of plugin.extensionPoints ?? []) {
          if (extensionPoints.has(point.id)) {
            throw new PlatformError({
              code: platformErrorCodes.extensionPointAlreadyDefined,
              message: `Extension point "${point.id}" is already defined`,
              details: { pluginId: plugin.id, extensionPointId: point.id },
            });
          }
          extensionPoints.set(point.id, point);
          store.add(disposable(() => extensionPoints.delete(point.id)));
        }
        validateRequires(plugin);
        for (const setting of plugin.settings ?? []) store.add(settings.register(setting));
        for (const command of plugin.commands ?? []) {
          store.add(commands.register(command));
          if (command.handler) {
            store.add(commands.registerHandler(command, (input, context) => command.handler?.({
              input,
              signal: context.signal,
              get: serviceGet,
              execute,
            })));
          }
        }
        for (const provider of plugin.services ?? []) {
          const service = await (provider as ServiceContribution<unknown>).factory({ get: serviceGet, contributions: reader });
          store.add(services.register(provider.token.id, service));
        }
        for (const contribution of plugin.contributions ?? []) await installContribution(plugin, contribution, store);
        const context: PluginSetupContext = {
          get: serviceGet,
          execute,
          contributions: reader,
          add: (disposableValue) => store.add(disposableValue),
          onDispose: (callback) => store.add(disposable(callback)),
        };
        const setupDisposable = await plugin.setup?.(context);
        if (setupDisposable) store.add(setupDisposable);
      }
    } catch (cause) {
      await dispose();
      throw cause;
    }
  }

  async function deactivatePlugin(pluginId: string): Promise<void> {
    const store = disposables.get(pluginId);
    if (!store) return;
    disposables.delete(pluginId);
    store.dispose();
  }

  async function dispose(): Promise<void> {
    for (const plugin of [...order].reverse()) await deactivatePlugin(plugin.id);
  }

  return { commands, settings, i18n, contributions: reader, start, dispose, deactivatePlugin, get: serviceGet, execute, getPlugins: () => [...plugins] };
}
