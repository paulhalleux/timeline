import type { CommandDefinition, CommandRegistry } from "@ptl/platform-core";
import * as React from "react";

/**
 * Subscribe to the command registry and return a stable snapshot array.
 *
 * `useSyncExternalStore` uses `Object.is` to detect snapshot changes, so the
 * snapshot function must return the same reference unless the registry actually
 * changed. We cache the last array and only replace it when the registry fires
 * an `onDidChange` event.
 */
export function useCommandRegistrySnapshot(
  registry: CommandRegistry,
): CommandDefinition<any, any>[] {
  const cacheRef = React.useRef<CommandDefinition<any, any>[] | null>(null);

  const getSnapshot = React.useCallback(() => {
    if (cacheRef.current === null) {
      cacheRef.current = registry.getAll();
    }

    return cacheRef.current;
  }, [registry]);

  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      return registry.onDidChange(() => {
        cacheRef.current = null;
        onStoreChange();
      }).dispose;
    },
    [registry],
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
