import type { TimedTextAdapter, TimedTextFormatId } from "./adapter";

/**
 * Dependency-injected registry of timed-text format adapters.
 *
 * The registry is intentionally small: it stores adapters and lets callers
 * resolve them by format id or extension. It does not parse, serialize, or
 * mutate documents itself.
 *
 * @example
 * ```ts
 * const registry = new TimedTextFormatRegistry();
 * registry.register(vttAdapter);
 * const adapter = registry.get("vtt");
 * ```
 */
export class TimedTextFormatRegistry {
  private readonly adapters = new Map<TimedTextFormatId, TimedTextAdapter<unknown, unknown>>();

  /**
   * Register or replace an adapter for its format id.
   *
   * @typeParam TDocument - Native document type handled by the adapter.
   * @typeParam TCue - Native cue type handled by the adapter.
   * @param adapter - Adapter to register.
   *
   * @example
   * ```ts
   * registry.register(srtAdapter);
   * ```
   */
  register<TDocument, TCue>(adapter: TimedTextAdapter<TDocument, TCue>): void {
    this.adapters.set(adapter.format, adapter as TimedTextAdapter<unknown, unknown>);
  }

  /**
   * Resolve an adapter by format id.
   *
   * @param format - Format id to resolve.
   * @returns Registered adapter for the format.
   * @throws When no adapter is registered for the format.
   *
   * @example
   * ```ts
   * const adapter = registry.get("srt");
   * ```
   */
  get(format: TimedTextFormatId): TimedTextAdapter<unknown, unknown> {
    const adapter = this.adapters.get(format);

    if (!adapter) {
      throw new Error(`Unsupported timed-text format: ${format}`);
    }

    return adapter;
  }

  /**
   * Resolve an adapter by file extension.
   *
   * @param extension - Extension with or without a leading dot.
   * @returns Matching adapter, or `undefined` when none is registered.
   *
   * @example
   * ```ts
   * const adapter = registry.findByExtension(".vtt");
   * ```
   */
  findByExtension(extension: string): TimedTextAdapter<unknown, unknown> | undefined {
    const normalized = extension.toLowerCase().replace(/^\./, "");
    return [...this.adapters.values()].find((adapter) => adapter.extensions.includes(normalized));
  }

  /**
   * List all registered adapters.
   *
   * @returns Registered adapters in insertion order.
   *
   * @example
   * ```ts
   * const adapters = registry.list();
   * ```
   */
  list(): TimedTextAdapter<unknown, unknown>[] {
    return [...this.adapters.values()];
  }
}
