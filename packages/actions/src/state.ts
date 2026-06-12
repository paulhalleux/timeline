/**
 * Runtime state used by UI surfaces before triggering an action.
 *
 * State is derived from the current application context. Keep it separate from
 * descriptors so static metadata can remain serializable.
 *
 * @example
 * ```ts
 * const state: ActionState = {
 *   visible: true,
 *   enabled: false,
 *   reason: "No file is open.",
 * };
 * ```
 */
export interface ActionState {
  visible: boolean;
  enabled: boolean;
  checked?: boolean;
  reason?: string;
}

/**
 * Default state for actions without a custom state resolver.
 *
 * @example
 * ```ts
 * const state = enabledActionState();
 * ```
 */
export function enabledActionState(): ActionState {
  return { visible: true, enabled: true };
}
