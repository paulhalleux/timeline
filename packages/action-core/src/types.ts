/**
 * Stable identifier for an action.
 *
 * Prefer dot-separated namespaces such as `file.import`, `edit.undo`, or
 * `timedText.cue.split` so host applications and plugins can safely compose
 * action contributions.
 */
export type ActionId = string;

/**
 * High-level grouping used by command palettes, menus, and shortcut help.
 */
export type ActionCategory = string;

/**
 * Source that triggered an action.
 */
export type ActionSource =
  | "api"
  | "button"
  | "commandPalette"
  | "contextMenu"
  | "menu"
  | "shortcut"
  | "toolbar"
  | (string & {});

/**
 * Optional keyboard binding metadata that adapters can map to a hotkey library.
 *
 * The action package intentionally stores key chords as strings and does not
 * depend on any runtime keyboard library. React, TanStack Hotkeys, native menu,
 * or Electron adapters can interpret the same metadata in their own layers.
 */
export interface ActionKeyBinding {
  keys: string | readonly string[];
  scope?: string;
  platform?: "all" | "linux" | "mac" | "windows";
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Menu placement metadata. Consumers decide how to render menu paths.
 */
export interface ActionMenuPlacement {
  path: readonly string[];
  order?: number;
}

/**
 * Toolbar placement metadata. Consumers decide how to render groups.
 */
export interface ActionToolbarPlacement {
  group: string;
  order?: number;
}

/**
 * Command palette metadata.
 */
export interface ActionPaletteOptions {
  keywords?: readonly string[];
  order?: number;
  hidden?: boolean;
}

/**
 * Presentation metadata shared by menus, toolbars, and palettes.
 */
export interface ActionPresentation {
  icon?: string;
  menu?: ActionMenuPlacement;
  toolbar?: ActionToolbarPlacement;
  palette?: ActionPaletteOptions;
}

/**
 * Runtime details about one action invocation.
 */
export interface ActionInvocation<TPayload = unknown> {
  source: ActionSource;
  payload?: TPayload;
  event?: unknown;
}

/**
 * Minimal host context shape. Applications usually extend this with their own
 * services, stores, timeline/editor instances, or selected entity accessors.
 */
export interface ActionContext {
  services?: Readonly<Record<string, unknown>>;
}

/**
 * Rich guard result for an action visibility/enabled check.
 */
export interface ActionGuardResult {
  ok: boolean;
  reason?: string;
}

/**
 * Action guard functions are synchronous so UI surfaces can cheaply render
 * visible and enabled states without awaiting every action.
 */
export type ActionGuard<TContext> = (
  context: TContext,
) => boolean | ActionGuardResult;

/**
 * UI-facing metadata shared by all action definitions.
 */
export interface ActionDescriptor {
  id: ActionId;
  title: string;
  category: ActionCategory;
  description?: string;
  source?: string;
  order?: number;
  keybindings?: readonly ActionKeyBinding[];
  presentation?: ActionPresentation;
}

/**
 * User-triggerable intent that can be invoked from buttons, menus, command
 * palettes, shortcuts, tests, or plugins.
 *
 * Actions orchestrate work. Domain operations, network requests, dialogs,
 * history stacks, and editor services remain implementation details behind
 * `run`.
 */
export interface ActionDefinition<
  TContext extends ActionContext = ActionContext,
  TResult = unknown,
  TPayload = unknown,
> extends ActionDescriptor {
  visibleWhen?: ActionGuard<TContext>;
  enabledWhen?: ActionGuard<TContext>;
  run(
    context: TContext,
    invocation: ActionInvocation<TPayload>,
  ): TResult | Promise<TResult>;
}

/**
 * Resolved action state for a concrete context.
 */
export interface ActionState {
  visible: boolean;
  enabled: boolean;
  hiddenReason?: string;
  disabledReason?: string;
}

/**
 * Successful action invocation result returned by ActionRegistry.run.
 */
export interface ActionRunSuccess<TResult = unknown> {
  ok: true;
  actionId: ActionId;
  value: TResult;
}

/**
 * Failed action invocation result returned by ActionRegistry.run.
 */
export interface ActionRunFailure {
  ok: false;
  actionId: ActionId;
  reason: "disabled" | "failed" | "hidden" | "not-found";
  message: string;
  error?: unknown;
}

/**
 * Action invocation result returned by ActionRegistry.run.
 */
export type ActionRunResult<TResult = unknown> =
  | ActionRunSuccess<TResult>
  | ActionRunFailure;

export interface ActionRegisterOptions {
  onDuplicate?: "throw" | "replace" | "ignore";
}

export interface ActionListOptions<TContext extends ActionContext> {
  context?: TContext;
  includeHidden?: boolean;
  includeDisabled?: boolean;
  category?: ActionCategory;
}
