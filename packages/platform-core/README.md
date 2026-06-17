# @ptl/platform-core

`@ptl/platform-core` now exposes a plugin-first, factory-based authoring model. Registries remain available as compatibility internals, but feature authors should declare owned capabilities on a plugin.

## Create a plugin

```ts
import { createPlugin } from "@ptl/platform-core";

export const createTimelinePlugin = () => createPlugin({
  id: "editor.timeline",
  displayName: "Timeline",
});
```

## Provide and consume a service

```ts
const playbackService = createServiceToken<PlaybackService>("playback");

createPlugin({
  id: "playback",
  services: [provideService(playbackService, () => createPlaybackService())],
});
```

Consumers use `context.get(playbackService)` or the React `useService(playbackService)` hook.

## Commands with colocated handlers

```ts
const playCommand = createCommand({
  id: "playback.play",
  title: "Play",
  handler: ({ get, signal }) => get(playbackService).play({ signal }),
});
```

The runtime still validates command input and result schemas, propagates abort signals, and installs/removes handlers with the owning plugin.

## Extension points and contributions

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

`platform.contributions.getAll(exportFormats)` returns typed values. `getEntries()` includes owner metadata. Subscriptions update as plugins are deactivated.

## Compose an application

```ts
const platform = createPlatform({
  plugins: [createExportPlugin(), createSrtExportPlugin()],
});

await platform.start();
await platform.dispose();
```

## Lifecycle and cleanup

Each plugin receives an owned disposable scope. Declarative services, commands, settings, extension points, and contributions are removed automatically when the plugin is deactivated or the platform is disposed. `setup()` is reserved for runtime side effects and can use `add()` or `onDispose()`.

## Migration from registries

| Old API | New API |
| --- | --- |
| `new PlatformRuntime()` as app composition | `createPlatform({ plugins })` |
| `definePlugin({ activate(context) { context.commands.register(...) } })` | `createPlugin({ commands: [createCommand({ handler })] })` |
| `context.services.register("id", service)` | `services: [provideService(createServiceToken<T>("id"), factory)]` |
| `context.extensionPoints.define(point)` | `extensionPoints: [createExtensionPoint(...)]` |
| `context.extensionPoints.contribute(point, value, owner)` | `contributions: [point.contribute(value)]` |
| command metadata plus `registerHandler()` | one `createCommand({ ..., handler })` object |

Compatibility registries are still exported for existing packages during migration, but they should not be used as the primary authoring API.
