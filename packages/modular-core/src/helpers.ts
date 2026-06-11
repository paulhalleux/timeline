import type { CoreApi } from "./core";
import type { Module, ModuleClass } from "./module";

/**
 * Helper type to define a module class with the `for` static method.
 *
 * This type combines the module class interface with a static `for` method
 * that allows easy retrieval of the module from a Core instance.
 *
 * @template T - The module instance type
 * @template TCore - The core API type
 */
export type ModuleWithFor<T extends Module, TCore extends CoreApi<unknown>> = ModuleClass<T> & {
  /**
   * Gets this module instance from the given core.
   *
   * @param core - The core instance to get the module from
   * @returns The module instance
   */
  for(core: TCore): T;
};

/**
 * Creates a base class for modules that includes the static `for` helper method.
 *
 * This is a utility function to reduce boilerplate when creating modules.
 * The returned class includes a static `for` method that retrieves the module
 * instance from a core.
 *
 * @template TCore - The core API type this module works with
 * @returns A base class for modules
 *
 * @example
 * ```ts
 * // Create a base module class for your app
 * const AppModule = createModuleBase<MyAppCore>();
 *
 * // Use it as a base class
 * class CounterModule extends AppModule {
 *   static id = "CounterModule";
 *
 *   attach(core: MyAppCore) {
 *     // ...
 *   }
 * }
 *
 * // Later, get the module easily
 * const counter = CounterModule.for(appCore);
 * ```
 */
export function createModuleBase<TCore extends CoreApi<unknown>>() {
  return class BaseModule {
    static id: string;

    /**
     * Gets this module instance from the given core.
     *
     * @param core - The core instance
     * @returns The module instance
     */
    static for<T extends Module>(this: ModuleClass<T>, core: TCore): T {
      return core.getModule(this);
    }

    /**
     * Attaches the module to a core instance.
     * Override this method to set up the module.
     */
    attach(_core: TCore): void {
      // Override in subclass
    }

    /**
     * Detaches the module from the core.
     * Override this method to clean up resources.
     */
    detach(): void {
      // Override in subclass
    }
  };
}

/**
 * Type for modules created with createModuleBase.
 *
 * @template TCore - The core API type
 */
export type BaseModule<TCore extends CoreApi<unknown>> = InstanceType<
  ReturnType<typeof createModuleBase<TCore>>
>;
