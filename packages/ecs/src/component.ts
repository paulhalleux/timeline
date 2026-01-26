import { QueryComponents } from "./query";

/**
 * A component is a piece of data that can be attached to an entity.
 */
export type Component<N extends string, T> = {
  name: N;
  create(initial?: Partial<T>): T;
};

/**
 * Extracts a key-value object from a Component.
 * If Required is true, the key is required, otherwise it is optional.
 */
type _ComponentAsObject<
  C extends Component<string, any>,
  Required extends boolean,
> =
  C extends Component<infer N, infer D>
    ? Required extends true
      ? {
          [K in N]: D;
        }
      : {
          [K in N]?: D;
        }
    : {};

/**
 * Extracts key-value objects from an array of Components and merges them.
 */
type _ComponentAsObjectArray<
  C extends readonly Component<string, any>[],
  Required extends boolean,
> = C extends [infer A, ...infer R]
  ? A extends Component<string, any>
    ? _ComponentAsObject<A, Required> &
        _ComponentAsObjectArray<
          R extends Component<string, any>[] ? R : [],
          Required
        >
    : {}
  : {};

/**
 * Extracts the data types from an array of Components.
 */
type _ComponentsOf<T extends QueryComponents> = T extends [infer A, ...infer R]
  ? A extends QueryComponents[number]
    ? (A extends {
        type: "required";
        components: infer C extends readonly Component<any, any>[];
      }
        ? _ComponentAsObjectArray<C, true>
        : A extends {
              type: "optional";
              components: infer C extends readonly Component<any, any>[];
            }
          ? _ComponentAsObjectArray<C, false>
          : {}) &
        _ComponentsOf<R extends QueryComponents ? R : []>
    : "Invalid QueryList element"
  : {};

type _Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type ComponentsOf<T extends QueryComponents> = _Prettify<
  _ComponentsOf<T>
>;

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
export function isComponent(v: any): v is Component<string, any> {
  return typeof v === "function" || typeof v === "object";
}

/**
 * Creates a new component with the given name.
 * @param name - The name of the component.
 * @param defaultData - The default data for the component.
 * @returns The created component.
 */
export function createComponent<N extends string, T>(
  name: N,
  defaultData?: Partial<T>,
): Component<N, T> {
  return {
    name,
    create: (initial: Partial<T> = {}) =>
      ({
        ...(defaultData || {}),
        ...initial,
      }) as T,
  };
}
