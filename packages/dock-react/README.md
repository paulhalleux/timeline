# @ptl/dock-react

React provider and hook adapter for `@ptl/dock-core`.

The package exposes a single `useDock()` hook. Consumers can destructure
state, actions, and selectors from one stable context value.

```tsx
import { DockProvider, useDock } from "@ptl/dock-react";

function Tabs() {
  const { workspace, actions } = useDock();

  return workspace.itemIds.map((id) => (
    <button key={id} onClick={() => actions.activateWorkspaceItem(id)}>
      {workspace.items[id]?.title}
    </button>
  ));
}

<DockProvider>
  <Tabs />
</DockProvider>;
```
