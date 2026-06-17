export interface ServiceToken<T> {
  readonly kind: "service";
  readonly id: string;
  readonly __service?: (value: T) => T;
}

export function createServiceToken<T>(id: string): ServiceToken<T> {
  return { kind: "service", id };
}
