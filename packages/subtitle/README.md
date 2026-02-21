# @ptl/subtitle

A clean, extensible subtitle parsing and editing library with support for multiple formats.

## Features

- **Multiple format support**: SRT, VTT (WebVTT), with extensible architecture for more
- **Immutable operations**: All transformations return new documents
- **Rich text support**: Parse and stringify styled text (bold, italic, colors)
- **Comprehensive operations**: Split, merge, shift, scale, fix overlaps, and more
- **Type-safe**: Full TypeScript support with excellent type inference
- **Zero dependencies**: Pure TypeScript implementation

## Installation

```bash
npm install @ptl/subtitle
```

## Quick Start

```typescript
import { srtParser, vttParser, shiftCues, mergeCues } from '@ptl/subtitle';

// Parse SRT
const doc = srtParser.parse(`
1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,000 --> 00:00:08,000
This is a subtitle.
`);

// Shift all cues by 1 second
const shifted = shiftCues(doc, 1000);

// Convert to VTT
const vttContent = vttParser.stringify(shifted);
```

## API Overview

### Types

- `Time` - Time representation in milliseconds
- `Cue<TMetadata>` - A single subtitle cue
- `SubtitleDocument<TFormat, TMetadata>` - An immutable subtitle document
- `Style` - Text styling properties
- `CueContent` - Content segments (text, styled text, line breaks)

### Format Parsers

Each parser includes `parseTime` and `formatTime` methods for its specific timestamp format:

```typescript
import { srtParser, vttParser, FormatRegistry, defaultRegistry } from '@ptl/subtitle';

// Parse and stringify documents
const doc = srtParser.parse(srtContent);
const output = srtParser.stringify(doc);

// Parse/format timestamps using the parser's methods
const time = srtParser.parseTime('00:01:30,500');  // { ms: 90500 }
const str = srtParser.formatTime({ ms: 90500 });   // '00:01:30,500'

// VTT uses different timestamp format (. instead of ,)
const vttTime = vttParser.parseTime('00:01:30.500');
const vttStr = vttParser.formatTime({ ms: 90500 });  // '00:01:30.500'

// Auto-detect format
const detected = defaultRegistry.detect(content);
const doc = defaultRegistry.parse(content);
```

### Operations

```typescript
import {
  // Query
  getCueAt,
  getCuesInRange,
  findOverlappingCues,
  
  // Transform
  addCue,
  removeCue,
  updateCue,
  mapCues,
  filterCues,
  sortCuesByTime,
  
  // Timing
  shiftCues,
  scaleCues,
  fixOverlaps,
  adjustGaps,
  snapToFrames,
  
  // Split/Merge
  splitCue,
  mergeCues,
} from '@ptl/subtitle';
```

### Creating Documents

```typescript
import { createDocument, time, plainTextToContent } from '@ptl/subtitle';

const doc = createDocument({
  format: 'srt',
  cues: [
    {
      start: time(1000),
      end: time(4000),
      content: plainTextToContent('Hello, world!'),
    },
  ],
});
```

### Working with Styled Text

```typescript
import { parseStyledText, stringifyStyledText, styledContent } from '@ptl/subtitle';

// Parse HTML-like tags
const content = parseStyledText('<b>Bold</b> and <i>italic</i>');

// Create styled content manually
const styled = styledContent('Red text', { color: 'red' });

// Convert back to text with tags
const text = stringifyStyledText(content);
```

## Extending with Custom Formats

```typescript
import { FormatRegistry, FormatParser, Time } from '@ptl/subtitle';

const myParser: FormatParser<'myformat', MyMetadata> = {
  format: 'myformat',
  
  // Required: timestamp parsing/formatting for this format
  parseTime(text: string): Time {
    // Parse your format's timestamp
    return { ms: 0 };
  },
  
  formatTime(time: Time): string {
    // Format to your format's timestamp
    return '00:00:00.000';
  },
  
  parse(input) { /* ... */ },
  stringify(doc) { /* ... */ },
  detect(input) { /* ... */ },  // optional
};

const registry = new FormatRegistry();
registry.register(myParser);
```

## License

MIT



