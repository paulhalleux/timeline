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
  /** Optional hotkey-library namespace; unrelated to ActionScope. */
  hotkeyScope?: string;
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
 * Context-menu placement metadata. Context menu renderers may use `path` for
 * nested menus or `group` for flat sectioned menus.
 */
export interface ActionContextMenuPlacement {
  path?: readonly string[];
  group?: string;
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
  contextMenu?: ActionContextMenuPlacement;
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
  /** Optional DOM/event target used by surface-aware adapters such as shortcuts. */
  target?: unknown;
  /** Explicit action surface id when the adapter already resolved one. */
  surfaceId?: string;
}

/**
 * Invocation input used when an action's payload type is known.
 *
 * Payloads are required for actions whose payload type is not `void`, and
 * omitted/optional for payload-less actions.
 */
export type ActionInvocationInput<TPayload> = [TPayload] extends [void]
  ? Omit<ActionInvocation<TPayload>, "payload"> & { payload?: TPayload }
  : ActionInvocation<TPayload> & { payload: TPayload };

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
 * Requires a trigger to originate from a concrete action surface id.
 */
export interface ActionSurfaceFocusRequirement {
  surfaceId: string;
}

/**
 * Whether a trigger must originate from a focused/active action surface.
 */
export type ActionFocusRequirement =
  | "none"
  | "optional"
  | "required"
  | ActionSurfaceFocusRequirement;

export type ActionTriggerFocus = Partial<
  Record<ActionSource, ActionFocusRequirement>
>;

/**
 * Focusable or addressable UI region that can receive surface-aware triggers.
 *
 * This is deliberately not an ActionScope. ActionScope is the logical registry +
 * context boundary; ActionSurface is a concrete UI target such as an editor pane.
 */
export interface ActionSurface {
  id: string;
  containsTarget?: (target: unknown) => boolean;
  isActive?: () => boolean;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ActionDescriptor {
  id: ActionId;
  title: string;
  category: ActionCategory;
  description?: string;
  source?: string;
  order?: number;
  keybindings?: readonly ActionKeyBinding[];
  presentation?: ActionPresentation;
  /**
   * Per-trigger focus requirements.
   *
   * Example: `{ shortcut: "required", menu: "none" }` means shortcuts only
   * run when a registered ActionSurface matches, while menubar invocations do
   * not need a focused surface. Use `{ shortcut: { surfaceId: "cue-list" } }`
   * when an action belongs to one concrete surface. Missing triggers default to
   * `"optional"`.
   */
  triggerFocus?: ActionTriggerFocus;
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

export type ActionResult<TAction> = TAction extends ActionDefinition<
  infer _TContext,
  infer TResult,
  infer _TPayload
>
  ? TResult
  : never;

export type ActionPayload<TAction> = TAction extends ActionDefinition<
  infer _TContext,
  infer _TResult,
  infer TPayload
>
  ? TPayload
  : never;

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
  reason: "disabled" | "failed" | "hidden" | "not-found" | "surface-unavailable";
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
