/**
 * A component is a piece of data that can be attached to an entity.
 */
export type Component<T> = {
  name: string;
  create(initial?: Partial<T>): T;
};

/**
 * Store for a component attached to an entity.
 */
export type ComponentStore<T> = {
  value: T;
  listeners: Set<(value: T) => void>;
};

/**
 * Determines if a value is a Component.
 * @param v - The value to check.
 * @returns True if the value is a Component, false otherwise.
 */
export function isComponent(v: any): v is Component<any> {
  return typeof v === "function" || typeof v === "object";
}

/**
 * Creates a new component with the given name.
 * @param name - The name of the component.
 * @param defaultData - The default data for the component.
 * @returns The created component.
 */
export function createComponent<T>(
  name: string,
  defaultData?: Partial<T>,
): Component<T> {
  return {
    name,
    create: (initial: Partial<T> = {}) =>
      ({
        ...(defaultData || {}),
        ...initial,
      }) as T,
  };
}
