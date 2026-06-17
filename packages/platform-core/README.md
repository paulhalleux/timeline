# @ptl/platform-core

`@ptl/platform-core` exposes one plugin-first, factory-based platform architecture. Applications install plugins; plugins own services, commands, settings, messages, extension points, contributions, menus, shortcuts, toolbars, setup, and cleanup. Mutable registries are not part of the public API.

## Public API

Use factories and capability readers:

```ts
import {
  createPlatform,
  createPlugin,
  createCommand,
  createExtensionPoint,
  createServiceToken,
  provideService,
} from "@ptl/platform-core";
```

The platform exposes read/execute capabilities only:

```ts
const platform = createPlatform({ plugins });
await platform.start();

platform.services.get(token);
platform.commands.execute(command, input);
platform.settings.get(setting);
platform.messages.format(message);
platform.contributions.getAll(extensionPoint);
```

Mutation happens through plugin lifecycle:

```ts
await platform.plugins.install(plugin);
await platform.plugins.uninstall(plugin.id);
```

## Creating a plugin

```ts
export const createTimelinePlugin = () => createPlugin({
  id: "editor.timeline",
  displayName: "Timeline",
  requires: [playbackService],
  services: [provideService(timelineService, ({ get }) => createTimelineService(get(playbackService)))],
  commands: [zoomInCommand],
  settings: [followPlaybackSetting],
});
```

## Services

```ts
export const playbackService = createServiceToken<PlaybackService>("playback.service");

export const createPlaybackPlugin = () => createPlugin({
  id: "playback",
  services: [provideService(playbackService, () => createPlaybackService())],
});
```

Service tokens participate in dependency ordering. A plugin that requires a service is activated after the provider plugin, independent of input order.

## Commands

Commands include their handler in one object:

```ts
const playCommand = createCommand({
  id: "playback.play",
  title: "Play",
  handler: ({ get, signal }) => get(playbackService).play({ signal }),
});
```

Handlers receive typed services, nested command execution, and the abort signal supplied to `platform.commands.execute()`.

## Extension points

```ts
export const exportFormats = createExtensionPoint<ExportFormat>({
  id: "export.formats",
  key: (format) => format.id,
  duplicates: "error",
});

export const createExportPlugin = () => createPlugin({
  id: "export",
  extensionPoints: [exportFormats],
});

export const createSrtExportPlugin = () => createPlugin({
  id: "export.format.srt",
  requires: [exportFormats],
  contributions: [exportFormats.contribute(srtExportFormat)],
});
```

Contributions are owned automatically by the contributing plugin. `getEntries()` exposes owner metadata. Uninstalling a plugin removes its contributions atomically and notifies subscribers after commit.

## Settings and messages

```ts
const followPlayback = createSetting({
  id: "timeline.followPlayback",
  defaultValue: true,
  scope: "profile",
});

const title = createMessage({
  id: "timeline.title",
  defaultMessage: "Timeline",
});
```

Plugins declare settings, messages, and translation bundles. The platform exposes `settings.get/set/reset/subscribe` and `messages.format/setLocale/subscribe`; registration is plugin-owned.

## Menus, shortcuts, and toolbars

Plugins declare UI metadata directly:

```ts
createPlugin({
  id: "export",
  commands: [runExportCommand],
  menus: [createMenuItem({ menu: "main.file", command: runExportCommand, group: "export" })],
  shortcuts: [createShortcut({ command: runExportCommand, shortcut: "mod+shift+e" })],
});
```

## Lifecycle and transactions

Activation is transactional per plugin. If extension-point definition, service creation, command installation, setting/message installation, contribution validation, UI installation, or setup fails, the runtime rolls back only that plugin and preserves previously active plugins. Dynamic uninstall recursively deactivates active dependents in reverse topological order.

## Diagnostics

`platform.diagnostics.snapshot()` returns read-only plugin states, dependency ownership, service providers, command owners, and extension-point owners without exposing mutable internal stores.
