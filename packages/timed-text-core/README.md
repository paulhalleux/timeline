# @ptl/timed-text-core

Shared timed-text abstractions for editor-facing packages. This package owns the normalized editor model, adapter contract, format contribution contract, registry, pure helper operations, QC issue types, validation pipeline types, and conversion warning types.

It intentionally contains no format-specific parser or serializer logic, no platform command registry integration, and no app command/history layer. Packages such as the subtitle editor own command metadata, shortcuts, menus, persistence, and undo/redo behavior around these pure operations.

## Format support pattern

A timed-text format plugin contributes one `TimedTextFormatContribution` to `timedTextFormatContributions`. The contribution contains the adapter plus capability metadata for operations such as `import`, `export`, `validate`, `normalize`, and `denormalize`.

```ts
import {
  createTimedTextFormatContribution,
  timedTextFormatContributions,
} from "@ptl/timed-text-core";
import { createPlugin } from "@ptl/platform-core";
import { vttAdapter } from "./adapter";

export const createVttTimedTextFormatPlugin = () =>
  createPlugin({
    id: "timed-text.format.vtt",
    requires: [timedTextFormatContributions],
    contributions: [
      timedTextFormatContributions.contribute(
        createTimedTextFormatContribution({ adapter: vttAdapter }),
      ),
    ],
  });
```

Features that need formats should filter this single contribution list by capability. For example, export UI lists contributions with an `export` capability instead of using a separate `export.formats` extension point.
