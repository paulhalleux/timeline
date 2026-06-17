import * as React from "react";
import type {
  ToolWindowContributionSource,
  DockApi,
  DockStateStore,
  DockState,
} from "@ptl/dock-core";
import { DockStateStore as DockStore } from "@ptl/dock-core";

const DockContext = React.createContext<DockStateStore | null>(null);

export type DockProviderProps = React.PropsWithChildren<{
  store?: DockStateStore;
  initialState?: DockState;
  toolWindows?: ToolWindowContributionSource;
}>;

/**
 * Provides a dock store to React components.
 *
 * @param props - Provider inputs. Pass a core `DockStateStore` when the app
 * owns the store lifecycle, or pass `initialState`/`toolWindows` to let the
 * provider create one.
 *
 * @example
 * ```tsx
 * const toolWindows = [{ id: "outline", title: "Outline", component: "dock.outline" }];
 * const store = new DockStateStore({ toolWindows });
 *
 * <DockProvider initialState={state}>
 *   <DockShell />
 * </DockProvider>
 * ```
 */
export function DockProvider({
  children,
  store,
  initialState,
  toolWindows,
}: DockProviderProps) {
  const defaultStore = React.useMemo(
    () => new DockStore({ initialState, toolWindows }),
    [initialState, toolWindows],
  );

  return (
    <DockContext.Provider value={store ?? defaultStore}>{children}</DockContext.Provider>
  );
}

/**
 * Read the imperative dock API.
 *
 * Use this hook for commands such as moving, resizing, opening, and closing
 * dock items. Use `useDockState(selector)` for reactive state reads.
 *
 * @returns The core `DockApi` from `@ptl/dock-core`.
 *
 * @example
 * ```tsx
 * const dock = useDock();
 * dock.resize("left-top", 50);
 * ```
 */
export function useDock(): DockApi {
  const store = React.useContext(DockContext);

  if (!store) {
    throw new Error("useDock must be used inside <DockProvider>.");
  }

  return store;
}

/**
 * Subscribe to a selected slice of dock state.
 *
 * Select the narrowest value a component needs. This keeps command-only code on
 * `useDock()` while render subscriptions remain explicit.
 *
 * @param selector - Maps the full dock state to the value this component
 * needs to render.
 * @returns The selected state value. React re-renders when the external store
 * publishes a change.
 *
 * @example
 * ```tsx
 * const activeId = useDockState((state) => state.workspace.activeItemId);
 * ```
 */
export function useDockState<T>(selector: (state: DockState) => T): T {
  const store = useDock();

  return React.useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
