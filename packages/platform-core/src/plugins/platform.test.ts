import { describe, expect, test } from "bun:test";
import {
  createCommand,
  createExtensionPoint,
  createPlatform,
  createPlugin,
  createPluginToken,
  createServiceToken,
  provideService,
} from "../index";

interface Format { id: string; order?: number }

describe("plugin-first platform", () => {
  test("rejects duplicate plugin ids", async () => {
    const platform = createPlatform({ plugins: [createPlugin({ id: "a" }), createPlugin({ id: "a" })] });
    await expect(platform.start()).rejects.toThrow('Plugin "a" is already registered');
  });

  test("orders dependencies and disposes in reverse order", async () => {
    const events: string[] = [];
    const platform = createPlatform({
      plugins: [
        createPlugin({ id: "b", requires: [createPluginToken("a")], setup: ({ onDispose }) => { events.push("b"); onDispose(() => events.push("/b")); } }),
        createPlugin({ id: "a", setup: ({ onDispose }) => { events.push("a"); onDispose(() => events.push("/a")); } }),
      ],
    });
    await platform.start();
    await platform.dispose();
    expect(events).toEqual(["a", "b", "/b", "/a"]);
  });

  test("validates missing service and extension point dependencies", async () => {
    const service = createServiceToken<{ value: number }>("missing.service");
    await expect(createPlatform({ plugins: [createPlugin({ id: "a", requires: [service] })] }).start()).rejects.toThrow('requires missing service "missing.service"');
    const point = createExtensionPoint<Format>({ id: "missing.point" });
    await expect(createPlatform({ plugins: [createPlugin({ id: "a", requires: [point] })] }).start()).rejects.toThrow('requires missing extension-point "missing.point"');
  });

  test("provides typed services to command handlers", async () => {
    const token = createServiceToken<{ read(): string }>("reader");
    const command = createCommand({ id: "read", title: "Read", handler: ({ get }) => get(token).read() });
    const platform = createPlatform({ plugins: [createPlugin({ id: "reader", services: [provideService(token, () => ({ read: () => "ok" }))], commands: [command] })] });
    await platform.start();
    await expect(platform.execute(command, undefined)).resolves.toBe("ok");
  });

  test("extension point contributions are ordered, owned, subscribed, and removed", async () => {
    const formats = createExtensionPoint<Format>({ id: "formats", key: (format) => format.id, duplicates: "error", orderBy: (format) => format.order ?? 0 });
    const seen: readonly Format[][] = [];
    const platform = createPlatform({
      plugins: [
        createPlugin({ id: "owner", extensionPoints: [formats] }),
        createPlugin({ id: "b", requires: [formats], contributions: [formats.contribute({ id: "b", order: 2 })] }),
        createPlugin({ id: "a", requires: [formats], contributions: [formats.contribute({ id: "a", order: 1 })], setup: ({ contributions, onDispose }) => onDispose(contributions.subscribe(formats, (values) => seen.push(values)).dispose) }),
      ],
    });
    await platform.start();
    expect(platform.contributions.getAll(formats).map((format) => format.id)).toEqual(["a", "b"]);
    expect(platform.contributions.getEntries(formats)[0].owner.pluginId).toBe("a");
    await platform.deactivatePlugin("a");
    expect(platform.contributions.getAll(formats).map((format) => format.id)).toEqual(["b"]);
  });
});
