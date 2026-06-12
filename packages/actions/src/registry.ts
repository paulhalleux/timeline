import type { ActionDefinition, ActionDescriptor, ActionId } from "./definition";

/**
 * Error thrown when registering invalid action definitions.
 *
 * @example
 * ```ts
 * throw new ActionRegistrationError("Duplicate action id: editor.file.save");
 * ```
 */
export class ActionRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionRegistrationError";
  }
}

/**
 * Read-only lookup surface for registered actions.
 *
 * @typeParam TContext - Application-specific services and state accessors.
 *
 * @example
 * ```ts
 * const action = registry.get("editor.file.save");
 * ```
 */
export interface ActionRegistry<TContext = unknown> {
  get(actionId: ActionId): ActionDefinition<TContext> | undefined;
  list(): ActionDefinition<TContext>[];
  descriptors(): ActionDescriptor[];
}

/**
 * Mutable registry for application action definitions.
 *
 * Registries are intentionally generic. They collect actions from editor
 * modules, plugins, or feature packages, but they do not know what those actions
 * do internally.
 *
 * @typeParam TContext - Application-specific services and state accessors.
 *
 * @example
 * ```ts
 * const registry = new MutableActionRegistry<EditorServices>();
 * registry.register(saveAction);
 * registry.registerMany([openAction, closeAction]);
 * ```
 */
export class MutableActionRegistry<TContext = unknown> implements ActionRegistry<TContext> {
  readonly #actions = new Map<ActionId, ActionDefinition<TContext>>();

  /**
   * Register one action definition.
   *
   * @param action - Action definition to register.
   * @returns This registry for fluent setup.
   *
   * @example
   * ```ts
   * registry.register(saveAction).register(openAction);
   * ```
   */
  register(action: ActionDefinition<TContext>): this {
    if (this.#actions.has(action.descriptor.id)) {
      throw new ActionRegistrationError(`Duplicate action id: ${action.descriptor.id}`);
    }

    this.#actions.set(action.descriptor.id, action);

    return this;
  }

  /**
   * Register several action definitions.
   *
   * @param actions - Action definitions to register.
   * @returns This registry for fluent setup.
   *
   * @example
   * ```ts
   * registry.registerMany([saveAction, closeAction]);
   * ```
   */
  registerMany(actions: ActionDefinition<TContext>[]): this {
    for (const action of actions) this.register(action);

    return this;
  }

  /**
   * Resolve an action definition by id.
   *
   * @param actionId - Id of the registered action.
   * @returns The matching action, or undefined when none exists.
   *
   * @example
   * ```ts
   * const action = registry.get("editor.file.save");
   * ```
   */
  get(actionId: ActionId): ActionDefinition<TContext> | undefined {
    return this.#actions.get(actionId);
  }

  /**
   * List registered action definitions in insertion order.
   *
   * @returns Registered action definitions.
   *
   * @example
   * ```ts
   * const definitions = registry.list();
   * ```
   */
  list(): ActionDefinition<TContext>[] {
    return Array.from(this.#actions.values());
  }

  /**
   * List serializable action descriptors in insertion order.
   *
   * @returns Serializable descriptors for menus, buttons, and palettes.
   *
   * @example
   * ```ts
   * const descriptors = registry.descriptors();
   * ```
   */
  descriptors(): ActionDescriptor[] {
    return this.list().map((action) => action.descriptor);
  }
}

/**
 * Create a mutable registry from initial action definitions.
 *
 * @param actions - Optional initial action definitions.
 * @returns Registry containing the provided actions.
 *
 * @example
 * ```ts
 * const registry = createActionRegistry([saveAction]);
 * ```
 */
export function createActionRegistry<TContext = unknown>(
  actions: ActionDefinition<TContext>[] = [],
): MutableActionRegistry<TContext> {
  return new MutableActionRegistry<TContext>().registerMany(actions);
}
