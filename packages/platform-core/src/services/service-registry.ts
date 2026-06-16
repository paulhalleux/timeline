import { disposable, type Disposable } from "../lifecycle/disposable";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";

/**
 * Typed service locator for platform composition.
 *
 * Services are addressed by string keys from the host application's service
 * map, so plugin code can depend on capabilities without importing singletons.
 *
 * @example
 * ```ts
 * type Services = { clipboard: ClipboardService };
 * const services = new ServiceRegistry<Services>();
 * services.register("clipboard", clipboard);
 * services.get("clipboard").writeText("Hello");
 * ```
 */
export class ServiceRegistry<TServices extends Record<string, unknown>> {
  private readonly services = new Map<
    keyof TServices & string,
    TServices[keyof TServices & string]
  >();

  register<TKey extends keyof TServices & string>(key: TKey, service: TServices[TKey]): Disposable {
    if (this.services.has(key)) {
      throw new PlatformError({
        code: platformErrorCodes.serviceAlreadyRegistered,
        message: `Service "${key}" is already registered`,
        details: { key },
      });
    }

    this.services.set(key, service);

    return disposable(() => {
      if (this.services.get(key) === service) {
        this.services.delete(key);
      }

      if (isDisposable(service)) {
        service.dispose();
      }
    });
  }

  get<TKey extends keyof TServices & string>(key: TKey): TServices[TKey] {
    if (!this.services.has(key)) {
      throw new PlatformError({
        code: platformErrorCodes.serviceMissing,
        message: `Service "${key}" is not registered`,
        details: { key },
      });
    }

    return this.services.get(key) as TServices[TKey];
  }

  has<TKey extends keyof TServices & string>(key: TKey): boolean {
    return this.services.has(key);
  }

  keys(): TKeyArray<TServices> {
    return [...this.services.keys()] as TKeyArray<TServices>;
  }
}

type TKeyArray<TServices extends Record<string, unknown>> = (keyof TServices & string)[];

function isDisposable(value: unknown): value is Disposable {
  return typeof value === "object" && value !== null && "dispose" in value;
}
