import type { StandardSchemaLike } from "../validation/schema";

export type MessageParams = Record<string, unknown>;

export type LocalizedText<TParams extends MessageParams = MessageParams> =
  | string
  | MessageDescriptor<TParams>;

export interface MessageDescriptor<TParams extends MessageParams = MessageParams> {
  id: string;
  defaultMessage: string;
  description?: string;
  params?: StandardSchemaLike<unknown, TParams>;
}

/**
 * Create a localizable message descriptor with typed formatting params.
 *
 * @example
 * ```ts
 * const tooFast = defineMessage<{ cps: number }>({
 *   id: "qc.tooFast",
 *   defaultMessage: "Reading speed is too high: {cps} cps",
 * });
 * ```
 */
export function defineMessage<TParams extends MessageParams = Record<string, never>>(
  descriptor: MessageDescriptor<TParams>,
): MessageDescriptor<TParams> {
  return descriptor;
}
