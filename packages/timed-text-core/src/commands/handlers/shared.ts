import type {
  EditorCommandContext,
  NormalizedEditorCommandContext,
} from "../types";

/**
 * Normalize optional command dependencies.
 *
 * @param context - Optional caller-provided command context.
 * @param createId - Default id factory.
 * @returns Required command context.
 *
 * @example
 * ```ts
 * const context = normalizeCommandContext(input, generateId);
 * ```
 */
export function normalizeCommandContext(
  context: EditorCommandContext = {},
  createId: (prefix: string) => string,
): NormalizedEditorCommandContext {
  return {
    now: context.now ?? (() => new Date()),
    createId: context.createId ?? createId,
  };
}
