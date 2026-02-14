import { Store } from "@ptl/store";

import type { Module, ModuleClass } from "./module";

/**
 * Options for creating a Core instance.
 *
 * @template TState - The type of the state managed by the core
 */
export interface CoreOptions<TState> {
  /**
   * The initial state for the core's store.
   */
  initialState: TState;

  /**
   * Initial modules to register with the core.
   * These modules will be attached during construction.
   */
  modules?: Module[];
}

/**
 * Base API interface that all Core instances expose.
 * Extend this interface to add domain-specific methods.
 *
 * @template TState - The type of the state managed by the core
 */
export interface CoreApi<TState> {
  /**
   * Gets the core's internal store.
   *
   * @returns The Store instance managing the core state
   */
  getStore(): Store<TState>;

  /**
   * Gets the current state from the store.
   *
   * @returns The current state
   */
  getState(): TState;

  /**
   * Selects a subset of the core state.
   *
   * @param selector - Function to select a subset of the state
   * @returns The selected subset of state
   */
  select<S>(selector: (state: TState) => S): S;

  /**
   * Subscribes to changes in the core state.
   *
   * @param listener - Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: TState) => void): () => void;

  /**
   * Gets a registered module by its class.
   *
   * @param moduleClass - The module class (with static `id`)
   * @returns The registered module instance
   * @throws Error if the module is not registered
   */
  getModule<T extends Module>(moduleClass: ModuleClass<T>): T;

  /**
   * Checks if a module is registered.
   *
   * @param moduleClass - The module class to check
   * @returns True if the module is registered
   */
  hasModule<T extends Module>(moduleClass: ModuleClass<T>): boolean;

  /**
   * Destroys the core instance and detaches all modules.
   */
  destroy(): void;
}

/**
 * A generic, modular core class that provides state management and
 * a plugin architecture through modules.
 *
 * This class serves as the foundation for building modular applications.
 * It manages a central store for state and allows registering modules
 * that extend functionality.
 *
 * @template TState - The type of the state managed by the core
 *
 * @example
 * ```ts
 * // Define your state
 * interface AppState {
 *   count: number;
 * }
 *
 * // Create a core instance
 * const core = new Core<AppState>({
 *   initialState: { count: 0 },
 *   modules: [new CounterModule()],
 * });
 *
 * // Access state
 * const count = core.select(s => s.count);
 *
 * // Get a module
 * const counter = core.getModule(CounterModule);
 * counter.increment();
 * ```
 */
export class Core<TState> implements CoreApi<TState> {
  protected readonly store: Store<TState>;
  protected modules: Module[] = [];
  private readonly _options: CoreOptions<TState>;

  constructor(options: CoreOptions<TState>) {
    this.store = new Store<TState>(options.initialState);
    this._options = options;
  }

  /**
   * Initializes the core by registering initial modules.
   *
   * This method is called after construction to set up the core instance.
   * It registers any modules provided in the options.
   */
  setup() {
    this._options.modules?.forEach((module) => this.registerModule(module));
  }

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  /**
   * Gets the core's internal store.
   *
   * @returns The Store instance managing the core state
   */
  getStore(): Store<TState> {
    return this.store;
  }

  /**
   * Gets the current state from the store.
   *
   * @returns The current state
   */
  getState(): TState {
    return this.store.get();
  }

  /**
   * Selects a subset of the core state.
   *
   * @param selector - Function to select a subset of the state
   * @returns The selected subset of state
   */
  select<S>(selector: (state: TState) => S): S {
    return this.store.select(selector);
  }

  /**
   * Subscribes to changes in the core state.
   *
   * @param listener - Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: TState) => void): () => void {
    return this.store.subscribe(listener);
  }

  // ---------------------------------------------------------------------------
  // Module Management
  // ---------------------------------------------------------------------------

  /**
   * Registers a module with the core.
   *
   * The module's `attach` method will be called with this core instance.
   * If the module was previously attached elsewhere, it will be detached first.
   *
   * @param module - The module to register
   */
  registerModule(module: Module): void {
    module.detach?.(); // Detach if already attached elsewhere
    module.attach(this);
    this.modules.push(module);
  }

  /**
   * Unregisters a module from the core.
   *
   * The module's `detach` method will be called if it exists.
   *
   * @param module - The module to unregister
   * @returns True if the module was found and removed
   */
  unregisterModule(module: Module): boolean {
    const index = this.modules.indexOf(module);
    if (index === -1) {
      return false;
    }

    module.detach?.();
    this.modules.splice(index, 1);
    return true;
  }

  /**
   * Gets a registered module by its class.
   *
   * @param moduleClass - The module class with static `id` property
   * @returns The registered module instance
   * @throws Error if the module is not registered
   */
  getModule<T extends Module>(moduleClass: ModuleClass<T>): T {
    const module = this.modules.find(
      (m) => (m.constructor as ModuleClass).id === moduleClass.id,
    );
    if (!module) {
      throw new Error(`Module ${moduleClass.id} not found`);
    }
    return module as T;
  }

  /**
   * Checks if a module is registered.
   *
   * @param moduleClass - The module class to check
   * @returns True if the module is registered
   */
  hasModule<T extends Module>(moduleClass: ModuleClass<T>): boolean {
    return this.modules.some(
      (m) => (m.constructor as ModuleClass).id === moduleClass.id,
    );
  }

  /**
   * Gets all registered modules.
   *
   * @returns Array of registered modules
   */
  getModules(): ReadonlyArray<Module> {
    return this.modules;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Destroys the core instance and detaches all registered modules.
   *
   * After calling this method, the core should not be used anymore.
   */
  destroy(): void {
    this.modules.forEach((module) => {
      module.detach?.();
    });
    this.modules = [];
  }
}
