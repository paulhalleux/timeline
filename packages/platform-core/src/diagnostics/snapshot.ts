import type { PlatformRuntime } from "../plugins/runtime";

export interface PluginDiagnostic {
  id: string;
  version?: string;
  dependencies: readonly string[];
}

export interface CommandDiagnostic {
  id: string;
}

export interface SettingDiagnostic {
  id: string;
  scope: string;
}

export interface ExtensionPointDiagnostic {
  id: string;
}

export interface PlatformDiagnosticSnapshot {
  plugins: PluginDiagnostic[];
  commands: CommandDiagnostic[];
  settings: SettingDiagnostic[];
  extensionPoints: ExtensionPointDiagnostic[];
}

export function getPlatformDiagnostics(runtime: PlatformRuntime<any>): PlatformDiagnosticSnapshot {
  const pluginOrder = runtime.resolveActivationOrder();

  return {
    plugins: pluginOrder.map((plugin) => ({
      id: plugin.id,
      version: plugin.version,
      dependencies: (plugin.dependencies ?? []).map(
        (dependency) => `${dependency.type}:${dependency.id}`,
      ),
    })),
    commands: runtime.commands.getAll().map((command) => ({ id: command.id })),
    settings: runtime.settings
      .getAll()
      .map((setting) => ({ id: setting.id, scope: setting.scope })),
    extensionPoints: runtime.extensionPoints.getAll().map((extensionPoint) => ({
      id: extensionPoint.id,
    })),
  };
}
