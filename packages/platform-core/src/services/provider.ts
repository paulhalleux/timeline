import type { ContributionReader } from "../extensions/extension-point";
import type { ServiceToken } from "./tokens";

export interface ServiceFactoryContext {
  get<T>(token: ServiceToken<T>): T;
  readonly contributions: ContributionReader;
}

export interface ServiceContribution<T> {
  readonly kind: "service-contribution";
  readonly token: ServiceToken<T>;
  readonly factory: (context: ServiceFactoryContext) => T | Promise<T>;
}

export function provideService<T>(
  token: ServiceToken<T>,
  factory: (context: ServiceFactoryContext) => T | Promise<T>,
): ServiceContribution<T> {
  return { kind: "service-contribution", token, factory };
}
