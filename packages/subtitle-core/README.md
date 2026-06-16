# @ptl/subtitle-core

Subtitle platform services built around `@ptl/timed-text-core`.

This package does not define a second subtitle document model. It stores and
commits `EditorTimedTextDocument` values, converts failed operation results into
typed platform errors, and emits document events with source/plugin attribution.

```ts
import { TimedTextDocumentService } from "@ptl/subtitle-core";
import { createEditorDocument } from "@ptl/timed-text-core";

const documents = new TimedTextDocumentService();
documents.open(createEditorDocument({ format: "vtt" }));
```
