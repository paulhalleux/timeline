import type { ContributionReader } from "../extensions/extension-point";
import type { MessageReader } from "../messages/message-service";
import type { SettingsReader } from "../settings/settings-registry";
import type { Disposable } from "../lifecycle/disposable";
import type { ServiceToken } from "./tokens";

export interface ServiceFactoryContext {
  get<T>(token: ServiceToken<T>): T;
  readonly contributions: ContributionReader;
  readonly settings: SettingsReader;
  readonly messages: MessageReader;
}

export interface ServiceProvider<T> {
  readonly kind: "service-provider";
  readonly token: ServiceToken<T>;
  readonly requires?: readonly ServiceToken<unknown>[];
  readonly factory: (context: ServiceFactoryContext) => T | Promise<T>;
  readonly dispose?: (service: T) => void | Promise<void>;
}

export function provideService<T>(
  token: ServiceToken<T>,
  factory: (context: ServiceFactoryContext) => T | Promise<T>,
  options: { readonly requires?: readonly ServiceToken<unknown>[]; readonly dispose?: (service: T) => void | Promise<void> } = {},
): ServiceProvider<T> {
  return { kind: "service-provider", token, factory, ...options };
}

export function isDisposable(value: unknown): value is Disposable {
  return typeof value === "object" && value !== null && "dispose" in value && typeof (value as { dispose?: unknown }).dispose === "function";
}
