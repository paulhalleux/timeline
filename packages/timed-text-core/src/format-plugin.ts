import {
  createExtensionPoint,
  createPlugin,
  createServiceToken,
  provideService,
} from "@ptl/platform-core";
import type { TimedTextAdapter, TimedTextFormatId } from "./adapter";

export type TimedTextFormatOperation =
  | "import"
  | "export"
  | "validate"
  | "normalize"
  | "denormalize";

export interface TimedTextFormatCapability {
  readonly operation: TimedTextFormatOperation;
  readonly label?: string;
}

export interface TimedTextFormatContribution<TDocument = unknown, TCue = unknown> {
  readonly adapter: TimedTextAdapter<TDocument, TCue>;
  readonly capabilities: readonly TimedTextFormatCapability[];
}

export function createTimedTextFormatContribution<TDocument, TCue>(definition: {
  readonly adapter: TimedTextAdapter<TDocument, TCue>;
  readonly capabilities?: readonly TimedTextFormatCapability[];
}): TimedTextFormatContribution<TDocument, TCue> {
  return {
    adapter: definition.adapter,
    capabilities: definition.capabilities ?? defaultTimedTextFormatCapabilities,
  };
}

export const defaultTimedTextFormatCapabilities: readonly TimedTextFormatCapability[] = [
  { operation: "import" },
  { operation: "export" },
  { operation: "validate" },
  { operation: "normalize" },
  { operation: "denormalize" },
];

/**
 * Single extension point for timed-text format plugins.
 *
 * A format plugin contributes one adapter plus the operations it supports. UI
 * features such as Import and Export filter this contribution list by
 * capability instead of owning separate `*.formats` registries.
 */
export const timedTextFormatContributions = createExtensionPoint<TimedTextFormatContribution>({
  id: "timed-text.format-contributions",
  key: (format) => format.adapter.format,
  duplicates: "error",
});

/** @deprecated Use `timedTextFormatContributions` with capabilities instead. */
export const timedTextFormats = timedTextFormatContributions;

export interface TimedTextFormatService {
  get(id: TimedTextFormatId): TimedTextAdapter<unknown, unknown>;
  getContribution(id: TimedTextFormatId): TimedTextFormatContribution;
  findByExtension(extension: string): TimedTextAdapter<unknown, unknown> | undefined;
  list(): readonly TimedTextAdapter<unknown, unknown>[];
  listContributions(operation?: TimedTextFormatOperation): readonly TimedTextFormatContribution[];
}

export const timedTextFormatService = createServiceToken<TimedTextFormatService>(
  "timed-text.format-service",
);

export const createTimedTextFormatHostPlugin = () =>
  createPlugin({
    id: "timed-text.formats",
    extensionPoints: [timedTextFormatContributions],
    services: [timedTextFormatServiceProvider] as never,
  });

export const timedTextFormatServiceProvider = provideService(
  timedTextFormatService,
  ({ contributions }) => ({
    get(id) {
      return this.getContribution(id).adapter;
    },
    getContribution(id) {
      const contribution = contributions
        .getAll(timedTextFormatContributions)
        .find((candidate) => candidate.adapter.format === id);
      if (!contribution) throw new Error(`Unsupported timed-text format: ${id}`);
      return contribution;
    },
    findByExtension(extension) {
      const normalized = extension.replace(/^\./, "").toLowerCase();
      return contributions
        .getAll(timedTextFormatContributions)
        .find((format) => format.adapter.extensions.includes(normalized))?.adapter;
    },
    list() {
      return contributions.getAll(timedTextFormatContributions).map((format) => format.adapter);
    },
    listContributions(operation) {
      const formats = contributions.getAll(timedTextFormatContributions);
      return operation
        ? formats.filter((format) =>
            format.capabilities.some((capability) => capability.operation === operation),
          )
        : formats;
    },
  }),
);
