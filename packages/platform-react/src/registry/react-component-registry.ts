import { disposable, PlatformError } from "@ptl/platform-core";
import type { Disposable } from "@ptl/platform-core";
import * as React from "react";

export type ReactComponentMap = Record<string, React.ComponentType<any>>;
export type ReactComponentSource =
  | ReactComponentMap
  | { resolve<TProps>(id: string): React.ComponentType<TProps> | undefined };

export function resolveReactComponent<TProps>(
  source: ReactComponentSource | undefined,
  id: string,
): React.ComponentType<TProps> | undefined {
  if (!source) {
    return undefined;
  }

  return "resolve" in source ? source.resolve<TProps>(id) : source[id];
}

export const reactComponentRegistryErrorCodes = {
  duplicateComponent: "platform-react.component.duplicate",
} as const;

/**
 * React-only component lookup table for plugin-owned UI.
 *
 * Prefer passing a plain `ReactComponentMap` for host-owned static UI.
 * Components are registered during plugin activation and removed by disposing
 * the returned registration. The registry is intentionally renderer-specific:
 * platform-core remains free of React types.
 *
 * @example
 * ```ts
 * const dispose = components.register("settings.maxCps", MaxCpsControl);
 * const Control = components.resolve<MaxCpsProps>("settings.maxCps");
 * dispose.dispose();
 * ```
 */
export class ReactComponentRegistry {
  private readonly components = new Map<string, React.ComponentType<any>>();

  register<TProps>(id: string, component: React.ComponentType<TProps>): Disposable {
    if (this.components.has(id)) {
      throw new PlatformError({
        code: reactComponentRegistryErrorCodes.duplicateComponent,
        message: `React component "${id}" is already registered`,
        details: { id },
      });
    }

    this.components.set(id, component);

    return disposable(() => {
      if (this.components.get(id) === component) {
        this.components.delete(id);
      }
    });
  }

  resolve<TProps>(id: string): React.ComponentType<TProps> | undefined {
    return this.components.get(id);
  }

  has(id: string): boolean {
    return this.components.has(id);
  }

  ids(): string[] {
    return [...this.components.keys()];
  }
}
