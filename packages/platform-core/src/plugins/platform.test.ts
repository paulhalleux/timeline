import { describe, expect, test } from "bun:test";
import * as publicApi from "../index";
import {
  createCommand,
  createExtensionPoint,
  createMessage,
  createPlatform,
  createPlugin,
  createPluginToken,
  createServiceToken,
  createSetting,
  createTranslationBundle,
  provideService,
} from "../index";

interface Format { id: string; order?: number }

const forbiddenExports = [
  "CommandRegistry",
  "ExtensionPointRegistry",
  "ServiceRegistry",
  "SettingsRegistry",
  "PlatformRuntime",
  "definePlugin",
  "defineExtensionPoint",
  "defineCommand",
  "PluginActivationContext",
  "PluginDependency",
  "PlatformContributions",
  "I18nService",
  "DisposableStore",
  "TypedEventEmitter",
];

describe("plugin-first platform", () => {
  test("root API does not export registry/runtime classes", () => {
    for (const name of forbiddenExports) expect(name in publicApi).toBe(false);
  });

  test("rejects duplicate plugin ids", () => {
    expect(() => createPlatform({ plugins: [createPlugin({ id: "a" }), createPlugin({ id: "a" })] })).toThrow('Plugin "a" is already installed');
  });

  test("input order does not matter for plugin, service, extension point, and contribution dependencies", async () => {
    const events: string[] = [];
    const service = createServiceToken<{ value: string }>("service");
    const point = createExtensionPoint<Format>({ id: "formats", key: (format) => format.id, duplicates: "error" });
    const platform = createPlatform({
      plugins: [
        createPlugin({ id: "contributor", contributions: [point.contribute({ id: "srt" })], setup: () => { events.push("contributor"); } }),
        createPlugin({ id: "consumer", requires: [service, point], setup: ({ get, contributions }) => { events.push(`${get(service).value}:${contributions.getAll(point)[0]?.id}`); } }),
        createPlugin({ id: "service", services: [provideService(service, () => ({ value: "service" }))], setup: () => { events.push("service"); } }),
        createPlugin({ id: "owner", extensionPoints: [point], setup: () => { events.push("owner"); } }),
      ],
    });
    await platform.start();
    expect(events).toEqual(["owner", "contributor", "service", "service:srt"]);
  });

  test("orders dependencies and disposes recursively in reverse dependent order", async () => {
    const events: string[] = [];
    const platform = createPlatform({
      plugins: [
        createPlugin({ id: "b", requires: [createPluginToken("a")], setup: ({ onDispose }) => { events.push("b"); onDispose(() => events.push("/b")); } }),
        createPlugin({ id: "a", setup: ({ onDispose }) => { events.push("a"); onDispose(() => events.push("/a")); } }),
      ],
    });
    await platform.start();
    await platform.plugins.deactivate("a");
    expect(events).toEqual(["a", "b", "/b", "/a"]);
  });

  test("validates missing service and extension point dependencies", async () => {
    const service = createServiceToken<{ value: number }>("missing.service");
    await expect(createPlatform({ plugins: [createPlugin({ id: "a", requires: [service] })] }).start()).rejects.toThrow('requires missing service "missing.service"');
    const point = createExtensionPoint<Format>({ id: "missing.point" });
    await expect(createPlatform({ plugins: [createPlugin({ id: "a", requires: [point] })] }).start()).rejects.toThrow('requires missing extension-point "missing.point"');
  });

  test("provides typed services to command handlers and removes commands on uninstall", async () => {
    const token = createServiceToken<{ read(): string }>("reader");
    const command = createCommand({ id: "read", title: "Read", handler: ({ get }) => get(token).read() });
    const platform = createPlatform({ plugins: [createPlugin({ id: "reader", services: [provideService(token, () => ({ read: () => "ok" }))], commands: [command] })] });
    await platform.start();
    await expect(platform.commands.execute(command, undefined)).resolves.toBe("ok");
    await platform.plugins.uninstall("reader");
    expect(platform.commands.get("read")).toBeUndefined();
  });

  test("extension point duplicate policies, ordering, ownership, and removal", async () => {
    const formats = createExtensionPoint<Format>({ id: "formats", key: (format) => format.id, duplicates: "replace", orderBy: (format) => format.order ?? 0 });
    const platform = createPlatform({ plugins: [createPlugin({ id: "owner", extensionPoints: [formats] })] });
    await platform.start();
    await platform.plugins.install(createPlugin({ id: "a", contributions: [formats.contribute({ id: "same", order: 2 })] }));
    await platform.plugins.install(createPlugin({ id: "b", contributions: [formats.contribute({ id: "same", order: 1 })] }));
    expect(platform.contributions.getAll(formats)).toEqual([{ id: "same", order: 1 }]);
    expect(platform.contributions.getEntries(formats)[0]?.owner.pluginId).toBe("b");
    await platform.plugins.uninstall("b");
    expect(platform.contributions.getAll(formats)).toEqual([{ id: "same", order: 2 }]);
  });

  test("dynamic install rolls back failing plugin only and batches contribution notifications", async () => {
    const point = createExtensionPoint<Format>({ id: "formats", key: (format) => format.id, duplicates: "error" });
    const seen: readonly Format[][] = [];
    const platform = createPlatform({ plugins: [createPlugin({ id: "owner", extensionPoints: [point] })] });
    await platform.start();
    const subscription = platform.contributions.subscribe(point, (values) => seen.push(values));
    await platform.plugins.install(createPlugin({ id: "ok", contributions: [point.contribute({ id: "ok" })] }));
    await expect(platform.plugins.install(createPlugin({ id: "bad", contributions: [point.contribute({ id: "bad" })], setup: () => { throw new Error("boom"); } }))).rejects.toThrow('Plugin "bad" failed during activation');
    expect(platform.plugins.get("ok")?.state).toBe("active");
    expect(platform.plugins.get("bad")?.state).toBe("failed");
    expect(platform.contributions.getAll(point)).toEqual([{ id: "ok" }]);
    expect(seen.map((values) => values.map((value) => value.id))).toEqual([[], ["ok"]]);
    subscription.dispose();
  });

  test("settings and messages are plugin owned", async () => {
    const setting = createSetting({ id: "timeline.follow", defaultValue: true, scope: "profile" });
    const title = createMessage({ id: "timeline.title", defaultMessage: "Timeline" });
    const platform = createPlatform({ plugins: [createPlugin({ id: "timeline", settings: [setting], messages: [title], translations: [createTranslationBundle({ locale: "fr", messages: { "timeline.title": "Chronologie" } })] })] });
    await platform.start();
    expect(platform.settings.get(setting)).toBe(true);
    await platform.settings.set(setting, false);
    expect(platform.settings.get(setting)).toBe(false);
    platform.messages.setLocale("fr");
    expect(platform.messages.format(title)).toBe("Chronologie");
    await platform.plugins.uninstall("timeline");
    expect(() => platform.settings.get(setting)).toThrow('Setting "timeline.follow" is not active');
  });
});
