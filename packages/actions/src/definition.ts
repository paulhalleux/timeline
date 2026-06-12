import type { ActionState } from "./state";

/**
 * Stable identifier for an action.
 *
 * Use namespaced ids so actions from different domains can coexist in the same
 * registry without coordination.
 *
 * @example
 * ```ts
 * const id: ActionId = "editor.file.save";
 * ```
 */
export type ActionId = string;

/**
 * Keyboard shortcut written as a portable accelerator string.
 *
 * `Mod` means Command on macOS and Control on Windows/Linux. Keep shortcuts as
 * data so menu bars, buttons, and command palettes can render them without
 * depending on DOM keyboard events.
 *
 * @example
 * ```ts
 * const shortcut: ActionShortcut = "Mod+S";
 * ```
 */
export type ActionShortcut = string;

/**
 * Serializable metadata that describes where an action may appear.
 *
 * This is intentionally presentation metadata, not rendering code. A React menu
 * can read the same placement data as a command palette or a native shell menu.
 *
 * @example
 * ```ts
 * const placement: ActionPlacement = {
 *   menu: "file",
 *   group: "primary",
 *   order: 10,
 * };
 * ```
 */
export interface ActionPlacement {
  menu?: string;
  toolbar?: string;
  palette?: boolean;
  group?: string;
  order?: number;
}

/**
 * Serializable description of an action.
 *
 * Descriptors are safe to inspect, sort, persist, and expose to UI code. The
 * executable behavior lives on {@link ActionDefinition.run}.
 *
 * @example
 * ```ts
 * const descriptor: ActionDescriptor = {
 *   id: "editor.file.save",
 *   title: "Save",
 *   shortcuts: ["Mod+S"],
 *   placement: [{ menu: "file", palette: true }],
 * };
 * ```
 */
export interface ActionDescriptor {
  id: ActionId;
  title: string;
  description?: string;
  category?: string;
  keywords?: string[];
  shortcuts?: ActionShortcut[];
  placement?: ActionPlacement[];
}

/**
 * Runtime dependencies supplied to action hooks.
 *
 * The generic context keeps this package independent from any editor model. An
 * app can pass a document store, router, modal service, adapter, or test double.
 *
 * @typeParam TContext - Application-specific services and state accessors.
 *
 * @example
 * ```ts
 * interface EditorContext {
 *   save(): Promise<void>;
 * }
 *
 * const context: ActionContext<EditorContext> = {
 *   source: "shortcut",
 *   services: { save: async () => undefined },
 * };
 * ```
 */
export interface ActionContext<TContext = unknown> {
  source?: ActionTriggerSource;
  services: TContext;
}

/**
 * Place from which an action was triggered.
 *
 * @example
 * ```ts
 * const source: ActionTriggerSource = "command-palette";
 * ```
 */
export type ActionTriggerSource =
  | "button"
  | "command-palette"
  | "menubar"
  | "shortcut"
  | "programmatic";

/**
 * Generic action definition.
 *
 * An action is a single runtime definition that can be triggered from many UI
 * surfaces. It may call a document command, open a dialog, focus an editor
 * region, or perform any other application-level behavior.
 *
 * @typeParam TContext - Application-specific services and state accessors.
 *
 * @example
 * ```ts
 * const saveAction: ActionDefinition<{ save(): Promise<void> }> = {
 *   descriptor: {
 *     id: "editor.file.save",
 *     title: "Save",
 *     shortcuts: ["Mod+S"],
 *     placement: [{ menu: "file", palette: true }],
 *   },
 *   run: async ({ services }) => {
 *     await services.save();
 *   },
 * };
 * ```
 */
export interface ActionDefinition<TContext = unknown> {
  descriptor: ActionDescriptor;
  getState?: (context: ActionContext<TContext>) => ActionState;
  run: (context: ActionContext<TContext>) => void | Promise<void>;
}
