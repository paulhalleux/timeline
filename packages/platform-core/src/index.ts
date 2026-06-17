export {
  CommandRegistry,
  defineCommand,
  type CommandDefinition,
  type CommandExecutionContext,
  type CommandHandler,
  type CommandInput,
  type CommandRegistryEvents,
  type CommandResult,
} from "./commands/command-registry";
export {
  type MenuContribution,
  type MenuCommandContribution,
  type MenuContributionBase,
  type MenuRootContribution,
  type MenuSubmenuContribution,
  type MenuToggleContribution,
  type PlatformContributions,
  type ShortcutContribution,
  type ToolbarContribution,
} from "./contributions/descriptors";
export {
  getPlatformDiagnostics,
  type CommandDiagnostic,
  type ExtensionPointDiagnostic,
  type PlatformDiagnosticSnapshot,
  type PluginDiagnostic,
  type SettingDiagnostic,
} from "./diagnostics/snapshot";
export { disposable, DisposableStore, type Disposable } from "./lifecycle/disposable";
export {
  PlatformError,
  platformErrorCodes,
  type PlatformErrorCode,
  type PlatformErrorOptions,
  isPlatformError,
} from "./errors/platform-error";
export { TypedEventEmitter, type EventMap } from "./events/typed-event-emitter";
export {
  defineExtensionPoint,
  ExtensionPointRegistry,
  type ExtensionPointDefinition,
} from "./extensions/extension-point-registry";
export { I18nService, type I18nEvents, type TranslationBundle } from "./i18n/i18n-service";
export { type ContributionOwner, type OwnedContribution } from "./contributions/owner";
export { resolvePluginOrder, type PluginResolveContext } from "./plugins/resolver";
export {
  createPlatform,
  definePlatformPlugin,
  PlatformRuntime,
  type CreatePlatformOptions,
  type PlatformCommandContribution,
  type PlatformCommandHandler,
  type PlatformPlugin,
  type PlatformRuntimeOptions,
} from "./plugins/runtime";
export {
  definePlugin,
  type PluginActivationContext,
  type PluginDefinition,
  type PluginDependency,
} from "./plugins/definition";
export {
  SchemaValidationError,
  validateSchema,
  type InferSchemaOutput,
  type StandardSchemaIssue,
  type StandardSchemaLike,
  type StandardSchemaResult,
} from "./validation/schema";
export { ServiceRegistry } from "./services/service-registry";
export {
  defineSetting,
  SettingsRegistry,
  type SettingControl,
  type SettingDefinition,
  type SettingScope,
  type SettingValue,
} from "./settings/settings-registry";
export {
  defineMessage,
  type LocalizedText,
  type MessageDescriptor,
  type MessageParams,
} from "./text/messages";
export {
  isContributionEnabled,
  isContributionVisible,
  type ContributionStatePredicate,
  type WhenPredicate,
} from "./contributions/when";
