import type { LocalizedText } from "../text/messages";

export const platformErrorCodes = {
  commandAlreadyRegistered: "platform.command.already-registered",
  commandHandlerMissing: "platform.command.handler-missing",
  commandHandlerAlreadyRegistered: "platform.command.handler-already-registered",
  contributionAlreadyRegistered: "platform.contribution.already-registered",
  dependencyCycle: "platform.plugin.dependency-cycle",
  duplicatePlugin: "platform.plugin.duplicate",
  extensionPointAlreadyDefined: "platform.extension-point.already-defined",
  extensionPointMissing: "platform.extension-point.missing",
  pluginActivationFailed: "platform.plugin.activation-failed",
  pluginMissing: "platform.plugin.missing",
  serviceAlreadyRegistered: "platform.service.already-registered",
  serviceMissing: "platform.service.missing",
  settingAlreadyRegistered: "platform.setting.already-registered",
} as const;

export type PlatformErrorCode =
  | (typeof platformErrorCodes)[keyof typeof platformErrorCodes]
  | string;

export interface PlatformErrorOptions {
  code: PlatformErrorCode;
  message: LocalizedText;
  details?: unknown;
  cause?: unknown;
  recoverable?: boolean;
}

/**
 * Structured platform failure with a stable code and optional diagnostics.
 *
 * Use `PlatformError` for developer-actionable runtime failures such as a
 * missing service, duplicate command, or failed plugin activation. The human
 * message can be a plain string or a localizable message descriptor.
 */
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
