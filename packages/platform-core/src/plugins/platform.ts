import type { CommandDefinition } from "../commands/create-command";
import type {
  MenuContribution,
  MenuRootContribution,
  ShortcutContribution,
  ToolbarContribution,
} from "../contributions/descriptors";
import { createEventEmitter } from "../events/typed-event-emitter";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import type {
  ContributionReader,
  ExtensionContribution,
  ExtensionPoint,
  ResolvedContribution,
} from "../extensions/extension-point";
import {
  createDisposableScope,
  disposable,
  type Disposable,
  type DisposableScope,
} from "../lifecycle/disposable";
import type {
  MessageDefinition,
  MessageReader,
  MessageService,
  TranslationBundle,
} from "../messages/message-service";
import { isDisposable, type ServiceProvider } from "../services/provider";
import type { ServiceToken } from "../services/tokens";
import type {
  SettingDefinition,
  SettingsReader,
  SettingsService,
  SettingsStorage,
} from "../settings/settings-registry";
import type { MessageParams } from "../text/messages";
import { validateSchema } from "../validation/schema";
import type { DependencyRequirement, PluginDefinition, PluginSetupContext } from "./plugin-api";

export interface PlatformFactoryOptions {
  readonly plugins?: readonly PluginDefinition[];
  readonly settingsStorage?: SettingsStorage;
  readonly locale?: string;
}

export type PluginState = "installed" | "activating" | "active" | "deactivating" | "failed";

export interface PluginSnapshot {
  readonly id: string;
  readonly version?: string;
  readonly displayName?: PluginDefinition["displayName"];
  readonly state: PluginState;
  readonly failure?: unknown;
  readonly dependencies: readonly string[];
}

export type PluginEvent =
  | { readonly kind: "installed"; readonly plugin: PluginSnapshot }
  | { readonly kind: "activated"; readonly plugin: PluginSnapshot }
  | { readonly kind: "deactivated"; readonly plugin: PluginSnapshot }
  | { readonly kind: "uninstalled"; readonly pluginId: string }
  | { readonly kind: "failed"; readonly plugin: PluginSnapshot; readonly error: unknown };

export interface PluginController {
  install(plugin: PluginDefinition): Promise<void>;
  uninstall(pluginId: string): Promise<void>;
  activate(pluginId: string): Promise<void>;
  deactivate(pluginId: string): Promise<void>;
  get(pluginId: string): PluginSnapshot | undefined;
  getAll(): readonly PluginSnapshot[];
  subscribe(listener: (event: PluginEvent) => void): Disposable;
}

export interface ServiceReader {
  get<T>(token: ServiceToken<T>): T;
  tryGet<T>(token: ServiceToken<T>): T | undefined;
  has(token: ServiceToken<unknown>): boolean;
}

export interface CommandExecutor {
  execute<TInput, TResult>(
    command: CommandDefinition<TInput, TResult>,
    input: TInput,
    options?: { readonly signal?: AbortSignal },
  ): Promise<TResult>;
  get(id: string): CommandDefinition<unknown, unknown> | undefined;
  getAll(): readonly CommandDefinition<unknown, unknown>[];
  subscribe(listener: (commands: readonly CommandDefinition<unknown, unknown>[]) => void): Disposable;
}

export interface PlatformUiReader {
  getMenuRoots(): readonly MenuRootContribution[];
  getMenus(): readonly MenuContribution[];
  getShortcuts(): readonly ShortcutContribution[];
  getToolbars(): readonly ToolbarContribution[];
  subscribe(listener: () => void): Disposable;
}

export interface DiagnosticsService {
  snapshot(): PlatformDiagnosticSnapshot;
}

export interface PlatformDiagnosticSnapshot {
  readonly plugins: readonly PluginSnapshot[];
  readonly services: readonly { readonly id: string; readonly ownerPluginId: string }[];
  readonly commands: readonly { readonly id: string; readonly ownerPluginId: string }[];
  readonly extensionPoints: readonly { readonly id: string; readonly ownerPluginId: string }[];
}

export interface Platform {
  start(): Promise<void>;
  dispose(): Promise<void>;
  readonly plugins: PluginController;
  readonly services: ServiceReader;
  readonly commands: CommandExecutor;
  readonly settings: SettingsService;
  readonly messages: MessageService;
  readonly contributions: ContributionReader;
  readonly ui: PlatformUiReader;
  readonly diagnostics: DiagnosticsService;
}

type ContributionEntry<T> = ResolvedContribution<T> & {
  readonly contribution: ExtensionContribution<T>;
  readonly key?: string;
};

interface PluginRecord {
  readonly plugin: PluginDefinition;
  state: PluginState;
  failure?: unknown;
  scope?: DisposableScope;
}

export function createPlatform(options: PlatformFactoryOptions = {}): Platform {
  const pluginEvents = createEventEmitter<{ event: PluginEvent }>();
  const commandEvents = createEventEmitter<{ changed: readonly CommandDefinition<unknown, unknown>[] }>();
  const settingsEvents = createEventEmitter<{ changed: { readonly id: string; readonly value: unknown } }>();
  const messageEvents = createEventEmitter<{ locale: string }>();
  const uiEvents = createEventEmitter<{ changed: undefined }>();

  const plugins = new Map<string, PluginRecord>();
  const extensionPointOwners = new Map<string, string>();
  const extensionPoints = new Map<string, ExtensionPoint<unknown>>();
  const contributions = new Map<string, ContributionEntry<unknown>[]>();
  const contributionListeners = new Map<string, Set<(values: readonly unknown[]) => void>>();
  const serviceProviders = new Map<string, { readonly ownerPluginId: string; readonly provider: ServiceProvider<unknown> }>();
  const services = new Map<string, unknown>();
  const commandOwners = new Map<string, string>();
  const commands = new Map<string, CommandDefinition<unknown, unknown>>();
  const settings = new Map<string, { readonly ownerPluginId: string; readonly definition: SettingDefinition<unknown> }>();
  const settingValues = new Map<string, unknown>();
  const messages = new Map<string, { readonly ownerPluginId: string; readonly definition: MessageDefinition }>();
  const translations = new Map<string, Map<string, { readonly ownerPluginId: string; readonly text: string }>>();
  const menuRoots: MenuRootContribution[] = [];
  const menus: MenuContribution[] = [];
  const shortcuts: ShortcutContribution[] = [];
  const toolbars: ToolbarContribution[] = [];
  let locale = options.locale ?? "en";
  let started = false;

  const contributionReader: ContributionReader = {
    getAll(point) {
      return getContributionEntries(point).map((entry) => entry.value);
    },
    getEntries: getContributionEntries,
    subscribe(point, listener) {
      const listeners = contributionListeners.get(point.id) ?? new Set();
      listeners.add(listener as (values: readonly unknown[]) => void);
      contributionListeners.set(point.id, listeners);
      listener(contributionReader.getAll(point));
      return disposable(() => listeners.delete(listener as (values: readonly unknown[]) => void));
    },
  };

  const serviceReader: ServiceReader = {
    get(token) {
      if (!services.has(token.id)) {
        throw new PlatformError({
          code: platformErrorCodes.serviceMissing,
          message: `Service provider for "${token.id}" is not active`,
          details: { serviceId: token.id },
        });
      }
      return services.get(token.id) as never;
    },
    tryGet(token) {
      return services.get(token.id) as never;
    },
    has(token) {
      return services.has(token.id);
    },
  };

  const commandExecutor: CommandExecutor = {
    async execute(command, input, executeOptions = {}) {
      const installed = commands.get(command.id);
      if (!installed) {
        throw new PlatformError({
          code: platformErrorCodes.commandMissing,
          message: `Command "${command.id}" is not active`,
          details: { commandId: command.id },
        });
      }
      if (!installed.handler) {
        throw new PlatformError({
          code: platformErrorCodes.commandHandlerMissing,
          message: `Command "${command.id}" does not have a handler`,
          details: { commandId: command.id },
        });
      }
      const validatedInput = installed.input ? await validateSchema(installed.input, input) : input;
      const result = await installed.handler({
        input: validatedInput as never,
        signal: executeOptions.signal ?? new AbortController().signal,
        get: serviceReader.get,
        execute: commandExecutor.execute,
      });
      return (installed.result ? await validateSchema(installed.result, result) : result) as never;
    },
    get(id) {
      return commands.get(id);
    },
    getAll() {
      return [...commands.values()];
    },
    subscribe(listener) {
      listener(commandExecutor.getAll());
      return commandEvents.on("changed", listener);
    },
  };

  const settingsService: SettingsService = {
    get(setting) {
      if (!settings.has(setting.id)) {
        throw new PlatformError({
          code: platformErrorCodes.settingMissing,
          message: `Setting "${setting.id}" is not active`,
          details: { settingId: setting.id },
        });
      }
      if (settingValues.has(setting.id)) return settingValues.get(setting.id) as never;
      return options.settingsStorage?.get(setting.id) ?? setting.defaultValue;
    },
    async set(setting, value) {
      if (!settings.has(setting.id)) throwMissingSetting(setting.id);
      settingValues.set(setting.id, value);
      await options.settingsStorage?.set(setting.id, value);
      settingsEvents.emit("changed", { id: setting.id, value });
    },
    async reset(setting) {
      if (!settings.has(setting.id)) throwMissingSetting(setting.id);
      settingValues.delete(setting.id);
      await options.settingsStorage?.delete(setting.id);
      settingsEvents.emit("changed", { id: setting.id, value: setting.defaultValue });
    },
    getDefinitions() {
      return [...settings.values()].map((entry) => entry.definition);
    },
    subscribe(setting, listener) {
      listener(settingsService.get(setting));
      return settingsEvents.on("changed", (event) => {
        if (event.id === setting.id) listener(event.value as never);
      });
    },
  };

  const messageService: MessageService = {
    format(message, params) {
      if (typeof message === "string") return interpolate(message, params);
      const descriptor = "kind" in message && message.kind === "message" ? message : undefined;
      const id = descriptor?.id ?? message.id;
      const fallback = descriptor?.defaultMessage ?? message.defaultMessage;
      const translated = translations.get(locale)?.get(id)?.text;
      return interpolate(translated ?? fallback, params);
    },
    setLocale(nextLocale) {
      locale = nextLocale;
      messageEvents.emit("locale", locale);
    },
    getLocale() {
      return locale;
    },
    subscribe(listener) {
      listener(locale);
      return messageEvents.on("locale", listener);
    },
  };

  const uiReader: PlatformUiReader = {
    getMenuRoots: () => [...menuRoots],
    getMenus: () => [...menus],
    getShortcuts: () => [...shortcuts],
    getToolbars: () => [...toolbars],
    subscribe(listener) {
      return uiEvents.on("changed", listener);
    },
  };

  const pluginController: PluginController = {
    async install(plugin) {
      if (plugins.has(plugin.id)) throwDuplicatePlugin(plugin.id);
      plugins.set(plugin.id, { plugin, state: "installed" });
      try {
        rebuildIndexes();
        emitPlugin("installed", plugin.id);
        if (started) await pluginController.activate(plugin.id);
      } catch (error) {
        const record = plugins.get(plugin.id);
        if (record) {
          record.state = "failed";
          record.failure = error;
        }
        rebuildIndexes();
        throw error;
      }
    },
    async uninstall(pluginId) {
      await pluginController.deactivate(pluginId);
      const record = requirePluginRecord(pluginId);
      plugins.delete(pluginId);
      rebuildIndexes();
      pluginEvents.emit("event", { kind: "uninstalled", pluginId: record.plugin.id });
    },
    async activate(pluginId) {
      const order = resolveActivationOrder();
      const targetIndex = order.findIndex((plugin) => plugin.id === pluginId);
      if (targetIndex === -1) throwMissingPlugin(pluginId);
      for (let index = 0; index <= targetIndex; index += 1) {
        const plugin = order[index];
        if (plugin) await activateOne(plugin.id);
      }
    },
    async deactivate(pluginId) {
      const order = resolveActivationOrder();
      const dependents = collectActiveDependents(pluginId, order).reverse();
      for (const dependent of dependents) await deactivateOne(dependent.id);
      await deactivateOne(pluginId);
    },
    get(pluginId) {
      const record = plugins.get(pluginId);
      return record ? snapshot(record) : undefined;
    },
    getAll() {
      return [...plugins.values()].map(snapshot);
    },
    subscribe(listener) {
      return pluginEvents.on("event", listener);
    },
  };

  function getContributionEntries<T>(point: ExtensionPoint<T>): readonly ResolvedContribution<T>[] {
    return [...(contributions.get(point.id) ?? [])] as readonly ResolvedContribution<T>[];
  }

  function notifyContributions(points: ReadonlySet<string>): void {
    for (const pointId of points) {
      const point = extensionPoints.get(pointId);
      if (!point) continue;
      for (const listener of contributionListeners.get(pointId) ?? []) {
        listener(contributionReader.getAll(point));
      }
    }
  }

  function rebuildIndexes(): void {
    extensionPointOwners.clear();
    serviceProviders.clear();
    for (const record of plugins.values()) {
      for (const point of record.plugin.extensionPoints ?? []) {
        const previous = extensionPointOwners.get(point.id);
        if (previous && previous !== record.plugin.id) throwDuplicateExtensionPoint(record.plugin.id, point.id);
        extensionPointOwners.set(point.id, record.plugin.id);
      }
      for (const provider of record.plugin.services ?? []) {
        const previous = serviceProviders.get(provider.token.id);
        if (previous && previous.ownerPluginId !== record.plugin.id) {
          throw new PlatformError({
            code: platformErrorCodes.duplicateServiceProvider,
            message: `Service "${provider.token.id}" is provided by both "${previous.ownerPluginId}" and "${record.plugin.id}"`,
            details: { serviceId: provider.token.id, pluginIds: [previous.ownerPluginId, record.plugin.id] },
          });
        }
        serviceProviders.set(provider.token.id, { ownerPluginId: record.plugin.id, provider });
      }
    }
  }

  function resolveActivationOrder(): readonly PluginDefinition[] {
    rebuildIndexes();
    const graph = new Map<string, Set<string>>();
    for (const record of plugins.values()) graph.set(record.plugin.id, dependenciesOf(record.plugin));
    const visited = new Set<string>();
    const visiting: string[] = [];
    const ordered: PluginDefinition[] = [];
    const visit = (pluginId: string): void => {
      if (visited.has(pluginId)) return;
      const cycleStart = visiting.indexOf(pluginId);
      if (cycleStart !== -1) {
        const cycle = [...visiting.slice(cycleStart), pluginId];
        throw new PlatformError({
          code: platformErrorCodes.dependencyCycle,
          message: `Plugin dependency cycle: ${cycle.join(" -> ")}`,
          details: { cycle },
        });
      }
      visiting.push(pluginId);
      for (const dependencyId of graph.get(pluginId) ?? []) visit(dependencyId);
      visiting.pop();
      visited.add(pluginId);
      ordered.push(requirePluginRecord(pluginId).plugin);
    };
    for (const pluginId of plugins.keys()) visit(pluginId);
    return ordered;
  }

  function dependenciesOf(plugin: PluginDefinition): Set<string> {
    const dependencies = new Set<string>();
    for (const requirement of plugin.requires ?? []) addRequirementDependency(plugin, requirement, dependencies);
    for (const contribution of plugin.contributions ?? []) {
      const owner = extensionPointOwners.get(contribution.point.id);
      if (!owner) {
        throw new PlatformError({
          code: platformErrorCodes.extensionPointMissing,
          message: `Plugin "${plugin.id}" contributes to missing extension point "${contribution.point.id}"`,
          details: { pluginId: plugin.id, extensionPointId: contribution.point.id },
        });
      }
      if (owner !== plugin.id) dependencies.add(owner);
    }
    for (const provider of plugin.services ?? []) {
      for (const service of provider.requires ?? []) {
        const owner = serviceProviders.get(service.id)?.ownerPluginId;
        if (!owner) {
          throw new PlatformError({
            code: platformErrorCodes.serviceMissing,
            message: `Plugin "${plugin.id}" provides "${provider.token.id}" but requires missing service "${service.id}"`,
            details: { pluginId: plugin.id, serviceId: service.id },
          });
        }
        if (owner !== plugin.id) dependencies.add(owner);
      }
    }
    return dependencies;
  }

  function addRequirementDependency(
    plugin: PluginDefinition,
    requirement: DependencyRequirement,
    dependencies: Set<string>,
  ): void {
    if (requirement.kind === "plugin") {
      if (!plugins.has(requirement.id)) {
        if (!requirement.optional) throwMissingDependency(plugin.id, "plugin", requirement.id);
        return;
      }
      if (requirement.id !== plugin.id) dependencies.add(requirement.id);
      return;
    }
    if (requirement.kind === "service") {
      const owner = serviceProviders.get(requirement.id)?.ownerPluginId;
      if (!owner) throwMissingDependency(plugin.id, "service", requirement.id);
      if (owner !== plugin.id) dependencies.add(owner);
      return;
    }
    const owner = extensionPointOwners.get(requirement.id);
    if (!owner) throwMissingDependency(plugin.id, "extension-point", requirement.id);
    if (owner !== plugin.id) dependencies.add(owner);
  }

  async function activateOne(pluginId: string): Promise<void> {
    const record = requirePluginRecord(pluginId);
    if (record.state === "active") return;
    if (record.state === "activating") return;
    record.state = "activating";
    const scope = createDisposableScope();
    const changedPoints = new Set<string>();
    try {
      for (const dependencyId of dependenciesOf(record.plugin)) {
        if (requirePluginRecord(dependencyId).state !== "active") {
          throw new PlatformError({
            code: platformErrorCodes.pluginActivationFailed,
            message: `Plugin "${record.plugin.id}" dependency "${dependencyId}" is not active`,
            details: { pluginId: record.plugin.id, dependencyId },
          });
        }
      }
      for (const point of record.plugin.extensionPoints ?? []) installExtensionPoint(record.plugin, point, scope);
      for (const provider of record.plugin.services ?? []) await installService(record.plugin, provider, scope);
      for (const command of record.plugin.commands ?? []) installCommand(record.plugin, command, scope);
      for (const setting of record.plugin.settings ?? []) installSetting(record.plugin, setting, scope);
      for (const message of record.plugin.messages ?? []) installMessage(record.plugin, message, scope);
      for (const bundle of record.plugin.translations ?? []) installTranslationBundle(record.plugin, bundle, scope);
      installUi(record.plugin, scope);
      for (const contribution of record.plugin.contributions ?? []) {
        await installContribution(record.plugin, contribution, scope);
        changedPoints.add(contribution.point.id);
      }
      const setupDisposable = await record.plugin.setup?.({
        get: serviceReader.get,
        execute: commandExecutor.execute,
        contributions: contributionReader,
        settings: settingsService,
        messages: messageService,
        add: (value) => scope.add(value),
        onDispose: (callback) => scope.onDispose(callback),
      } satisfies PluginSetupContext);
      if (setupDisposable) scope.add(setupDisposable);
      record.scope = scope;
      record.state = "active";
      record.failure = undefined;
      emitPlugin("activated", pluginId);
      notifyContributions(changedPoints);
      commandEvents.emit("changed", commandExecutor.getAll());
      uiEvents.emit("changed", undefined);
    } catch (cause) {
      try {
        scope.dispose();
      } finally {
        record.scope = undefined;
        record.state = "failed";
        record.failure = cause;
      }
      const error = new PlatformError({
        code: platformErrorCodes.pluginActivationFailed,
        message: `Plugin "${record.plugin.id}" failed during activation`,
        details: { pluginId: record.plugin.id },
        cause,
      });
      pluginEvents.emit("event", { kind: "failed", plugin: snapshot(record), error });
      throw error;
    }
  }

  async function deactivateOne(pluginId: string): Promise<void> {
    const record = plugins.get(pluginId);
    if (!record || record.state !== "active") return;
    record.state = "deactivating";
    const changedPoints = new Set((record.plugin.contributions ?? []).map((contribution) => contribution.point.id));
    try {
      record.scope?.dispose();
    } finally {
      record.scope = undefined;
      record.state = "installed";
      emitPlugin("deactivated", pluginId);
      notifyContributions(changedPoints);
      commandEvents.emit("changed", commandExecutor.getAll());
      uiEvents.emit("changed", undefined);
    }
  }

  function installExtensionPoint(
    plugin: PluginDefinition,
    point: ExtensionPoint<unknown>,
    scope: DisposableScope,
  ): void {
    if (extensionPoints.has(point.id)) throwDuplicateExtensionPoint(plugin.id, point.id);
    extensionPoints.set(point.id, point);
    scope.add(disposable(() => extensionPoints.delete(point.id)));
  }

  async function installService(
    plugin: PluginDefinition,
    provider: ServiceProvider<unknown>,
    scope: DisposableScope,
  ): Promise<void> {
    if (services.has(provider.token.id)) {
      throw new PlatformError({
        code: platformErrorCodes.duplicateServiceProvider,
        message: `Service "${provider.token.id}" is already active`,
        details: { pluginId: plugin.id, serviceId: provider.token.id },
      });
    }
    const service = await provider.factory({
      get: serviceReader.get,
      contributions: contributionReader,
      settings: settingsService,
      messages: messageService,
    });
    services.set(provider.token.id, service);
    scope.add(disposable(() => {
      services.delete(provider.token.id);
      const dispose = async (): Promise<void> => {
        if (provider.dispose) await provider.dispose(service);
        else if (isDisposable(service)) service.dispose();
      };
      void dispose();
    }));
  }

  function installCommand(
    plugin: PluginDefinition,
    command: CommandDefinition<unknown, unknown>,
    scope: DisposableScope,
  ): void {
    if (commands.has(command.id)) {
      throw new PlatformError({
        code: platformErrorCodes.commandAlreadyRegistered,
        message: `Command "${command.id}" is already active`,
        details: { pluginId: plugin.id, commandId: command.id },
      });
    }
    commands.set(command.id, command);
    commandOwners.set(command.id, plugin.id);
    scope.add(disposable(() => {
      commands.delete(command.id);
      commandOwners.delete(command.id);
    }));
  }

  function installSetting(
    plugin: PluginDefinition,
    setting: SettingDefinition<unknown>,
    scope: DisposableScope,
  ): void {
    if (settings.has(setting.id)) {
      throw new PlatformError({
        code: platformErrorCodes.settingAlreadyRegistered,
        message: `Setting "${setting.id}" is already active`,
        details: { pluginId: plugin.id, settingId: setting.id },
      });
    }
    settings.set(setting.id, { ownerPluginId: plugin.id, definition: setting });
    scope.add(disposable(() => settings.delete(setting.id)));
  }

  function installMessage(plugin: PluginDefinition, message: MessageDefinition, scope: DisposableScope): void {
    messages.set(message.id, { ownerPluginId: plugin.id, definition: message });
    scope.add(disposable(() => messages.delete(message.id)));
  }

  function installTranslationBundle(plugin: PluginDefinition, bundle: TranslationBundle, scope: DisposableScope): void {
    const map = translations.get(bundle.locale) ?? new Map();
    translations.set(bundle.locale, map);
    for (const [id, text] of Object.entries(bundle.messages)) map.set(id, { ownerPluginId: plugin.id, text });
    scope.add(disposable(() => {
      for (const id of Object.keys(bundle.messages)) {
        if (map.get(id)?.ownerPluginId === plugin.id) map.delete(id);
      }
    }));
  }

  function installUi(plugin: PluginDefinition, scope: DisposableScope): void {
    const push = <T>(target: T[], values: readonly T[] | undefined): void => {
      const installed: T[] = [];
      for (const value of values ?? []) {
        target.push(value);
        installed.push(value);
      }
      scope.add(disposable(() => {
        for (const value of installed) {
          const index = target.indexOf(value);
          if (index !== -1) target.splice(index, 1);
        }
      }));
    };
    push(menuRoots, plugin.menuRoots);
    push(menus, plugin.menus);
    push(shortcuts, plugin.shortcuts);
    push(toolbars, plugin.toolbars);
  }

  async function installContribution(
    plugin: PluginDefinition,
    contribution: ExtensionContribution<unknown>,
    scope: DisposableScope,
  ): Promise<void> {
    const point = extensionPoints.get(contribution.point.id);
    if (!point) {
      throw new PlatformError({
        code: platformErrorCodes.extensionPointMissing,
        message: `Extension point "${contribution.point.id}" is not active`,
        details: { pluginId: plugin.id, extensionPointId: contribution.point.id },
      });
    }
    const value = point.schema ? await validateSchema(point.schema, contribution.value) : contribution.value;
    const key = point.key?.(value);
    const list = contributions.get(point.id) ?? [];
    const previousIndex = key ? list.findIndex((entry) => entry.key === key) : -1;
    const previous = previousIndex >= 0 ? list[previousIndex] : undefined;
    if (previous && point.duplicates === "error") {
      throw new PlatformError({
        code: platformErrorCodes.contributionAlreadyRegistered,
        message: `Contribution "${key}" is already registered for extension point "${point.id}"`,
        details: { pluginId: plugin.id, extensionPointId: point.id, contributionKey: key },
      });
    }
    const entry: ContributionEntry<unknown> = {
      contribution,
      key,
      value,
      owner: { pluginId: plugin.id, pluginVersion: plugin.version },
    };
    if (previous && point.duplicates === "replace") list.splice(previousIndex, 1, entry);
    else list.push(entry);
    list.sort((left, right) => (point.orderBy?.(left.value) ?? 0) - (point.orderBy?.(right.value) ?? 0));
    contributions.set(point.id, list);
    scope.add(disposable(() => {
      const current = contributions.get(point.id) ?? [];
      const index = current.indexOf(entry);
      if (index !== -1) {
        if (previous && point.duplicates === "replace") current.splice(index, 1, previous);
        else current.splice(index, 1);
      }
      current.sort((left, right) => (point.orderBy?.(left.value) ?? 0) - (point.orderBy?.(right.value) ?? 0));
    }));
  }

  function collectActiveDependents(pluginId: string, order: readonly PluginDefinition[]): PluginDefinition[] {
    const result: PluginDefinition[] = [];
    const visit = (targetId: string): void => {
      for (const plugin of order) {
        if (plugin.id === targetId || requirePluginRecord(plugin.id).state !== "active") continue;
        if (dependenciesOf(plugin).has(targetId) && !result.some((existing) => existing.id === plugin.id)) {
          visit(plugin.id);
          result.push(plugin);
        }
      }
    };
    visit(pluginId);
    return result;
  }

  function snapshot(record: PluginRecord): PluginSnapshot {
    return {
      id: record.plugin.id,
      version: record.plugin.version,
      displayName: record.plugin.displayName,
      state: record.state,
      failure: record.failure,
      dependencies: [...dependenciesOf(record.plugin)],
    };
  }

  function emitPlugin(kind: "installed" | "activated" | "deactivated", pluginId: string): void {
    pluginEvents.emit("event", { kind, plugin: snapshot(requirePluginRecord(pluginId)) });
  }

  function requirePluginRecord(pluginId: string): PluginRecord {
    const record = plugins.get(pluginId);
    if (!record) throwMissingPlugin(pluginId);
    return record;
  }

  function throwMissingPlugin(pluginId: string): never {
    throw new PlatformError({
      code: platformErrorCodes.pluginMissing,
      message: `Plugin "${pluginId}" is not installed`,
      details: { pluginId },
    });
  }

  function throwDuplicatePlugin(pluginId: string): never {
    throw new PlatformError({
      code: platformErrorCodes.duplicatePlugin,
      message: `Plugin "${pluginId}" is already installed`,
      details: { pluginId },
    });
  }

  function throwDuplicateExtensionPoint(pluginId: string, extensionPointId: string): never {
    throw new PlatformError({
      code: platformErrorCodes.extensionPointAlreadyDefined,
      message: `Extension point "${extensionPointId}" is already defined`,
      details: { pluginId, extensionPointId },
    });
  }

  function throwMissingDependency(pluginId: string, dependencyType: string, dependencyId: string): never {
    const code = dependencyType === "plugin"
      ? platformErrorCodes.pluginMissing
      : dependencyType === "service"
        ? platformErrorCodes.serviceMissing
        : platformErrorCodes.extensionPointMissing;
    throw new PlatformError({
      code,
      message: `Plugin "${pluginId}" requires missing ${dependencyType} "${dependencyId}"`,
      details: { pluginId, dependencyType, dependencyId },
    });
  }

  function throwMissingSetting(settingId: string): never {
    throw new PlatformError({
      code: platformErrorCodes.settingMissing,
      message: `Setting "${settingId}" is not active`,
      details: { settingId },
    });
  }

  function interpolate(template: string, params?: MessageParams): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(params[key] ?? ""));
  }

  for (const plugin of options.plugins ?? []) {
    if (plugins.has(plugin.id)) throwDuplicatePlugin(plugin.id);
    plugins.set(plugin.id, { plugin, state: "installed" });
  }
  rebuildIndexes();

  return {
    async start() {
      if (started) return;
      const order = resolveActivationOrder();
      const activated: string[] = [];
      try {
        for (const plugin of order) {
          await activateOne(plugin.id);
          activated.push(plugin.id);
        }
        started = true;
      } catch (error) {
        for (const pluginId of activated.reverse()) await deactivateOne(pluginId);
        throw error;
      }
    },
    async dispose() {
      const order = resolveActivationOrder();
      for (const plugin of [...order].reverse()) await deactivateOne(plugin.id);
      started = false;
    },
    plugins: pluginController,
    services: serviceReader,
    commands: commandExecutor,
    settings: settingsService,
    messages: messageService,
    contributions: contributionReader,
    ui: uiReader,
    diagnostics: {
      snapshot() {
        return {
          plugins: pluginController.getAll(),
          services: [...serviceProviders.entries()].map(([id, entry]) => ({ id, ownerPluginId: entry.ownerPluginId })),
          commands: [...commandOwners.entries()].map(([id, ownerPluginId]) => ({ id, ownerPluginId })),
          extensionPoints: [...extensionPointOwners.entries()].map(([id, ownerPluginId]) => ({ id, ownerPluginId })),
        };
      },
    },
  };
}


export interface ApplicationFactoryOptions extends PlatformFactoryOptions {}

export function createApplication(options: ApplicationFactoryOptions = {}): Platform {
  return createPlatform(options);
}
