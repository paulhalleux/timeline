import type { Disposable } from "../lifecycle/disposable";
import type { StandardSchemaLike } from "../validation/schema";

export interface ExtensionContribution<TContribution> {
  readonly kind: "extension-contribution";
  readonly point: ExtensionPoint<TContribution>;
  readonly value: TContribution;
}

export interface ExtensionPoint<TContribution> {
  readonly kind: "extension-point";
  readonly id: string;
  readonly schema?: StandardSchemaLike<unknown, TContribution>;
  readonly key?: (value: TContribution) => string;
  readonly duplicates?: "error" | "replace" | "allow";
  readonly orderBy?: (value: TContribution) => number;
  contribute(value: TContribution): ExtensionContribution<TContribution>;
}

export interface ExtensionPointOptions<TContribution> {
  readonly id: string;
  readonly schema?: StandardSchemaLike<unknown, TContribution>;
  readonly key?: (value: TContribution) => string;
  readonly duplicates?: "error" | "replace" | "allow";
  readonly orderBy?: (value: TContribution) => number;
}

export interface ResolvedContribution<TContribution> {
  readonly value: TContribution;
  readonly owner: {
    readonly pluginId: string;
    readonly pluginVersion?: string;
  };
}

export interface ContributionReader {
  getAll<TContribution>(point: ExtensionPoint<TContribution>): readonly TContribution[];
  getEntries<TContribution>(point: ExtensionPoint<TContribution>): readonly ResolvedContribution<TContribution>[];
  subscribe<TContribution>(
    point: ExtensionPoint<TContribution>,
    listener: (values: readonly TContribution[]) => void,
  ): Disposable;
}

export function createExtensionPoint<TContribution>(
  options: ExtensionPointOptions<TContribution>,
): ExtensionPoint<TContribution> {
  return {
    kind: "extension-point",
    ...options,
    contribute(value) {
      return { kind: "extension-contribution", point: this, value };
    },
  };
}
