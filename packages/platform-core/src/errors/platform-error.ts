import type { LocalizedText } from "../text/messages";

export const platformErrorCodes = {
  commandAlreadyRegistered: "platform.command.already-registered",
  commandMissing: "platform.command.missing",
  commandHandlerMissing: "platform.command.handler-missing",
  contributionAlreadyRegistered: "platform.contribution.already-registered",
  dependencyCycle: "platform.dependency.cycle",
  deactivationBlocked: "platform.plugin.deactivation-blocked",
  duplicatePlugin: "platform.plugin.duplicate",
  duplicateServiceProvider: "platform.service.provider-duplicate",
  extensionPointAlreadyDefined: "platform.extension-point.already-defined",
  extensionPointMissing: "platform.extension-point.missing",
  pluginActivationFailed: "platform.plugin.activation-failed",
  pluginFailed: "platform.plugin.failed",
  pluginMissing: "platform.plugin.missing",
  serviceMissing: "platform.service.missing",
  settingAlreadyRegistered: "platform.setting.already-registered",
  settingMissing: "platform.setting.missing",
  schemaValidationFailed: "platform.schema.validation-failed",
} as const;

export type PlatformErrorCode = (typeof platformErrorCodes)[keyof typeof platformErrorCodes];

export interface PlatformErrorOptions {
  readonly code: PlatformErrorCode;
  readonly message: LocalizedText;
  readonly details?: unknown;
  readonly cause?: unknown;
  readonly recoverable?: boolean;
}

export class PlatformError extends Error {
  readonly code: PlatformErrorCode;
  readonly localizedMessage: LocalizedText;
  readonly details?: unknown;
  readonly recoverable: boolean;

  constructor(options: PlatformErrorOptions) {
    super(typeof options.message === "string" ? options.message : options.message.defaultMessage, {
      cause: options.cause,
    });
    this.name = "PlatformError";
    this.code = options.code;
    this.localizedMessage = options.message;
    this.details = options.details;
    this.recoverable = options.recoverable ?? false;
  }
}

export function isPlatformError(error: unknown): error is PlatformError {
  return error instanceof PlatformError;
}
