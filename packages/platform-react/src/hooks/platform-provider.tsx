import type {
  CommandDefinition,
  ContributionReader,
  ExtensionPoint,
  MenuContribution,
  MenuRootContribution,
  Platform,
  ServiceToken,
  ShortcutContribution,
} from "@ptl/platform-core";
import * as React from "react";

import { ReactComponentRegistry } from "../registry/react-component-registry";

export interface PlatformReactContributions<TContext = unknown> {
  readonly menuRoots?: readonly MenuRootContribution<string, TContext>[];
  readonly menus?: readonly MenuContribution<
    string,
    CommandDefinition<unknown, unknown>,
    TContext
  >[];
  readonly shortcuts?: readonly ShortcutContribution<
    CommandDefinition<unknown, unknown>,
    TContext
  >[];
}

export interface PlatformReactContextValue<TContext = unknown> {
  readonly platform: Platform;
  readonly components: ReactComponentRegistry;
  readonly contributions: PlatformReactContributions<TContext>;
}

const PlatformReactContext = React.createContext<PlatformReactContextValue | null>(null);

export interface PlatformProviderProps<TContext = unknown> {
  readonly platform: Platform;
  readonly components?: ReactComponentRegistry;
  readonly contributions?: PlatformReactContributions<TContext>;
  readonly children: React.ReactNode;
}

export function PlatformProvider<TContext = unknown>({
  platform,
  components,
  contributions,
  children,
}: PlatformProviderProps<TContext>) {
  const defaultComponents = React.useMemo(() => new ReactComponentRegistry(), []);
  const platformContributions = usePlatformUiContributions<TContext>(platform);
  const value = React.useMemo<PlatformReactContextValue<TContext>>(
    () => ({
      platform,
      components: components ?? defaultComponents,
      contributions: contributions ?? platformContributions,
    }),
    [components, contributions, defaultComponents, platform, platformContributions],
  );
  return <PlatformReactContext.Provider value={value}>{children}</PlatformReactContext.Provider>;
}

function usePlatformUiContributions<TContext>(
  platform: Platform,
): PlatformReactContributions<TContext> {
  const read = React.useCallback<() => PlatformReactContributions<TContext>>(
    () => ({
      menuRoots: platform.ui.getMenuRoots() as readonly MenuRootContribution<string, TContext>[],
      menus: platform.ui.getMenus() as readonly MenuContribution<
        string,
        CommandDefinition<unknown, unknown>,
        TContext
      >[],
      shortcuts: platform.ui.getShortcuts() as readonly ShortcutContribution<
        CommandDefinition<unknown, unknown>,
        TContext
      >[],
    }),
    [platform],
  );
  const [snapshot, setSnapshot] = React.useState(read);

  React.useEffect(() => {
    setSnapshot(read());
    return platform.ui.subscribe(() => setSnapshot(read())).dispose;
  }, [platform, read]);

  return snapshot;
}

export function usePlatform<TContext = unknown>(): PlatformReactContextValue<TContext> {
  const context = React.useContext(PlatformReactContext);
  if (!context) throw new Error("Platform hooks must be used inside <PlatformProvider>.");
  return context as PlatformReactContextValue<TContext>;
}

export function useService<T>(token: ServiceToken<T>): T {
  return usePlatform().platform.services.get(token);
}

export function useContributions<T>(point: ExtensionPoint<T>): readonly T[] {
  const { platform } = usePlatform();
  const reader: ContributionReader = platform.contributions;
  const [values, setValues] = React.useState<readonly T[]>(() => reader.getAll(point));
  React.useEffect(() => {
    setValues(reader.getAll(point));
    return reader.subscribe(point, setValues).dispose;
  }, [point, reader]);
  return values;
}

export function useCommand<TInput, TResult>(command: CommandDefinition<TInput, TResult>) {
  const { platform } = usePlatform();
  return React.useCallback(
    (input: TInput, options?: { readonly signal?: AbortSignal }) =>
      platform.commands.execute(command, input, options),
    [command, platform],
  );
}
