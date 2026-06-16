# @ptl/timed-text-core

Shared timed-text abstractions for editor-facing packages. This package owns the normalized editor model, adapter contract, registry, pure helper operations, QC issue types, validation pipeline types, and conversion warning types.

It intentionally contains no format-specific parser or serializer logic, no platform command registry integration, and no app command/history layer. Packages such as the subtitle editor own command metadata, shortcuts, menus, persistence, and undo/redo behavior around these pure operations.
