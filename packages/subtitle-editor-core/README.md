# @ptl/subtitle-editor-core

Core logic for the subtitle editor - UI framework agnostic.

## Overview

`@ptl/subtitle-editor-core` provides the business logic for a subtitle editor application. Built on top of `@ptl/modular-core`, it offers a modular architecture with pluggable modules for:

- **Track Management** - Loading, parsing, and editing subtitle files
- **Playback Control** - Play, pause, seek, volume, playback rate
- **Markers** - Timeline markers/bookmarks
- **Selection** - Track and cue selection state
- **History** - Undo/redo with full action tracking

## Installation

```bash
bun add @ptl/subtitle-editor-core
```

## Basic Usage

```typescript
import { SubtitleEditor } from "@ptl/subtitle-editor-core";

// Create an editor instance
const editor = new SubtitleEditor({
  autoSelectNewTracks: true,
});

// Load a subtitle file
const file = new File(["..."], "subtitles.srt");
const trackId = await editor.loadSubtitleFile(file);

// Access modules directly
const tracks = editor.tracks.getTracks();
const activeTrack = editor.getActiveTrack();

// Control playback
editor.playback.play();
editor.playback.seek(5000); // 5 seconds
editor.playback.setVolume(0.8);

// Add markers
editor.addMarkerAtCurrentTime("bookmark", "Important scene");

// Navigate
editor.goToNextCue();
editor.goToPreviousMarker();

// Undo/Redo
editor.undo();
editor.redo();
console.log("Can undo:", editor.canUndo());
console.log("Can redo:", editor.canRedo());

// Listen to events
editor.on("track:added", (event) => {
  console.log("Track added:", event.data);
});

// Cleanup
editor.destroy();
```

## Architecture

The `SubtitleEditor` extends `Core` from `@ptl/modular-core` and comes with five built-in modules:

### TrackModule

Manages subtitle tracks and cue operations.

```typescript
// Access via editor.tracks or TrackModule.for(editor)
editor.tracks.loadFile(file);
editor.tracks.getTracks();
editor.tracks.updateCue(trackId, cueIndex, { text: "New text" });
editor.tracks.deleteCue(trackId, cueIndex);
editor.tracks.export(trackId); // Returns formatted subtitle string
```

### PlaybackModule

Controls media playback state.

```typescript
// Access via editor.playback or PlaybackModule.for(editor)
editor.playback.play();
editor.playback.pause();
editor.playback.seek(1000);
editor.playback.setVolume(0.5);
editor.playback.setPlaybackRate(1.5);
editor.playback.toggleMute();
```

### SelectionModule

Manages selection state for tracks and cues.

```typescript
// Access via editor.selection or SelectionModule.for(editor)
editor.selection.setActiveTrack(trackId);
editor.selection.selectCue(trackId, cueIndex);
editor.selection.selectCueRange(trackId, 0, 10);
editor.selection.getSelectedCues(trackId);
```

### MarkerModule

Manages timeline markers.

```typescript
// Access via editor.markers or MarkerModule.for(editor)
editor.markers.add(5000, "bookmark", "Label");
editor.markers.getMarkers();
editor.markers.getByType("chapter");
editor.markers.getNearest(5000, "after");
editor.markers.select(markerId);
```

## Connecting to Video Element

The editor needs a playback controller to control actual media playback:

```typescript
import { createVideoController } from "@ptl/subtitle-editor-core";

// In your React/UI code
const videoRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  if (videoRef.current) {
    const controller = createVideoController(videoRef.current, editor.playback);
    editor.connectPlaybackController(controller);
    
    return () => {
      editor.disconnectPlaybackController();
    };
  }
}, []);
```

## Adding Custom Modules

You can extend the editor with custom modules:

```typescript
import { EditorModule, SubtitleEditor } from "@ptl/subtitle-editor-core";
import { Store } from "@ptl/modular-core";

interface HistoryState {
  undoStack: unknown[];
  redoStack: unknown[];
}

class HistoryModule implements EditorModule<{ undo(): void; redo(): void }> {
  static id = "HistoryModule";
  
  private store = new Store<HistoryState>({
    undoStack: [],
    redoStack: [],
  });
  
  static for(editor: SubtitleEditor): HistoryModule {
    return editor.getModule(this);
  }
  
  attach(editor: SubtitleEditorApi): void {
    // Setup subscriptions to track changes
  }
  
  detach(): void {}
  
  undo(): void { /* ... */ }
  redo(): void { /* ... */ }
}

// Use it
const editor = new SubtitleEditor({
  modules: [new HistoryModule()],
});

const history = HistoryModule.for(editor);
history.undo();
```

## Events

The editor emits the following events:

| Event | Data | Description |
|-------|------|-------------|
| `track:added` | `SubtitleTrack` | Track was loaded |
| `track:removed` | `SubtitleTrack` | Track was removed |
| `track:updated` | `SubtitleTrack` | Track was modified |
| `marker:added` | `TimelineMarker` | Marker was added |
| `marker:removed` | `TimelineMarker` | Marker was removed |
| `marker:updated` | `TimelineMarker` | Marker was modified |
| `selection:changed` | Selection state | Selection changed |
| `playback:changed` | Playback state | Playback state changed |
| `media:loaded` | `LoadedMedia` | Media file loaded |
| `media:unloaded` | `null` | Media was unloaded |

## API Reference

### SubtitleEditor

| Method | Description |
|--------|-------------|
| `loadMedia(file)` | Load video metadata |
| `unloadMedia()` | Unload current media |
| `loadSubtitleFile(file)` | Load and parse subtitle file |
| `removeTrack(trackId)` | Remove a track |
| `getActiveTrack()` | Get active track |
| `addMarkerAtCurrentTime(type?, label?)` | Add marker at playhead |
| `goToNextCue()` | Navigate to next cue |
| `goToPreviousCue()` | Navigate to previous cue |
| `goToNextMarker()` | Navigate to next marker |
| `goToPreviousMarker()` | Navigate to previous marker |
| `on(eventType, handler)` | Subscribe to events |
| `reset()` | Reset editor state |
| `destroy()` | Cleanup resources |

## License

MIT
