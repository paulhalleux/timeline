/**
 * Interface representing a module that can be attached to a Core instance.
 *
 * Modules are the building blocks of a modular application. Each module
 * encapsulates a specific piece of functionality and can have its own
 * internal state, managed via a Store.
 *
 * @template TApi - Additional API methods exposed by the module
 * @template TCoreApi - The type of the Core API this module can attach to
 *
 * @example
 * ```ts
 * export class PlayheadModule implements Module<PlayheadApi, MyCore> {
 *   static id = "PlayheadModule";
 *
 *   attach(core: MyCore): void {
 *     // Initialize module with access to core
 *   }
 *
 *   detach(): void {
 *     // Cleanup resources
 *   }
 * }
 * ```
 */
export type Module<TApi extends object = object, TCoreApi = unknown> = {
  /**
   * Attaches the module to the given core instance.
   *
   * This method is called when the module is registered with a Core instance.
   * Use this to set up subscriptions, initialize state, or perform any
   * setup that requires access to the core.
   *
   * @param core - The core instance to attach the module to
   */
  attach(core: TCoreApi): void;

  /**
   * Detaches the module from the core.
   *
   * This method is called when the module is removed or the core is destroyed.
   * Use this to clean up subscriptions, timers, event listeners, etc.
   */
  detach?(): void;
} & TApi;

/**
 * Interface for a module class constructor.
 *
 * Module classes must have a static `id` property that uniquely identifies
 * the module type. This is used for module lookup via `getModule()`.
 *
 * @template T - The module instance type
 */
export interface ModuleClass<T extends Module = Module> {
  /**
   * Unique identifier for the module type.
   * Used to retrieve the module instance from a Core.
   */
  id: string;

  /**
   * Constructor signature for the module.
   */

  new (...args: any[]): T;
}
