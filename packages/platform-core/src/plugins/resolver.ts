import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import type { ExtensionPointRegistry } from "../extensions/extension-point-registry";
import type { PluginDefinition } from "./definition";
import type { ServiceRegistry } from "../services/service-registry";

export interface PluginResolveContext<TServices extends Record<string, unknown>> {
  services?: ServiceRegistry<TServices>;
  extensionPoints?: ExtensionPointRegistry;
}

/**
 * Validate plugin dependencies and return deterministic activation order.
 *
 * Missing required dependencies fail before activation starts. Optional
 * dependencies are ignored for ordering and validation, which lets plugins
 * opportunistically integrate with features that may not be installed.
 */
export function resolvePluginOrder<TServices extends Record<string, unknown>>(
  plugins: readonly PluginDefinition<TServices>[],
  context: PluginResolveContext<TServices> = {},
): PluginDefinition<TServices>[] {
  const byId = new Map<string, PluginDefinition<TServices>>();

  for (const plugin of plugins) {
    if (byId.has(plugin.id)) {
      throw new PlatformError({
        code: platformErrorCodes.duplicatePlugin,
        message: `Plugin "${plugin.id}" is registered more than once`,
        details: { pluginId: plugin.id },
      });
    }

    byId.set(plugin.id, plugin);
  }

  validateExternalDependencies(plugins, byId, context);

  const ordered: PluginDefinition<TServices>[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (plugin: PluginDefinition<TServices>, path: string[]) => {
    if (visited.has(plugin.id)) {
      return;
    }

    if (visiting.has(plugin.id)) {
      const cycleStart = path.indexOf(plugin.id);
      const cycle = [...path.slice(cycleStart), plugin.id];
      throw new PlatformError({
        code: platformErrorCodes.dependencyCycle,
        message: `Plugin dependency cycle detected: ${cycle.join(" -> ")}`,
        details: { cycle },
      });
    }

    visiting.add(plugin.id);

    for (const dependency of plugin.dependencies ?? []) {
      if (dependency.type !== "plugin" || dependency.optional) {
        continue;
      }

      const dependencyPlugin = byId.get(dependency.id);
      if (!dependencyPlugin) {
        continue;
      }

      visit(dependencyPlugin, [...path, dependency.id]);
    }

    visiting.delete(plugin.id);
    visited.add(plugin.id);
    ordered.push(plugin);
  };

  for (const plugin of plugins) {
    visit(plugin, [plugin.id]);
  }

  return ordered;
}

function validateExternalDependencies<TServices extends Record<string, unknown>>(
  plugins: readonly PluginDefinition<TServices>[],
  byId: Map<string, PluginDefinition<TServices>>,
  context: PluginResolveContext<TServices>,
): void {
  for (const plugin of plugins) {
    for (const dependency of plugin.dependencies ?? []) {
      if (dependency.optional) {
        continue;
      }

      if (dependency.type === "plugin" && !byId.has(dependency.id)) {
        throw new PlatformError({
          code: platformErrorCodes.pluginMissing,
          message: `Plugin "${plugin.id}" depends on missing plugin "${dependency.id}"`,
          details: { pluginId: plugin.id, dependency },
        });
      }

      if (
        dependency.type === "service" &&
        !context.services?.has(dependency.id as keyof TServices & string)
      ) {
        throw new PlatformError({
          code: platformErrorCodes.serviceMissing,
          message: `Plugin "${plugin.id}" depends on missing service "${dependency.id}"`,
          details: { pluginId: plugin.id, dependency },
        });
      }

      if (dependency.type === "extension-point" && !context.extensionPoints?.has(dependency.id)) {
        throw new PlatformError({
          code: platformErrorCodes.extensionPointMissing,
          message: `Plugin "${plugin.id}" depends on missing extension point "${dependency.id}"`,
          details: { pluginId: plugin.id, dependency },
        });
      }
    }
  }
}
