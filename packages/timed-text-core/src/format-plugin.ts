import { createExtensionPoint, createServiceToken, provideService } from "@ptl/platform-core";
import type { TimedTextAdapter, TimedTextFormatId } from "./adapter";

export const timedTextFormats = createExtensionPoint<TimedTextAdapter<unknown, unknown>>({
  id: "timed-text.formats",
  key: (adapter) => adapter.format,
  duplicates: "error",
});

export interface TimedTextFormatService {
  get(id: TimedTextFormatId): TimedTextAdapter<unknown, unknown>;
  findByExtension(extension: string): TimedTextAdapter<unknown, unknown> | undefined;
  list(): readonly TimedTextAdapter<unknown, unknown>[];
}

export const timedTextFormatService = createServiceToken<TimedTextFormatService>("timed-text.format-service");

export const timedTextFormatServiceProvider = provideService(
  timedTextFormatService,
  ({ contributions }) => ({
    get(id) {
      const adapter = contributions.getAll(timedTextFormats).find((candidate) => candidate.format === id);
      if (!adapter) throw new Error(`Unsupported timed-text format: ${id}`);
      return adapter;
    },
    findByExtension(extension) {
      const normalized = extension.replace(/^\./, "").toLowerCase();
      return contributions.getAll(timedTextFormats).find((adapter) => adapter.extensions.includes(normalized));
    },
    list() {
      return contributions.getAll(timedTextFormats);
    },
  }),
);
