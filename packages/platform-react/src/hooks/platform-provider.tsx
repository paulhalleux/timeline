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

export interface PlatformReactContributions<TContext = unknown> {
  readonly menuRoots?: readonly MenuRootContribution<string, TContext>[];
  readonly menus?: readonly MenuContribution<string, CommandDefinition<unknown, unknown>, TContext>[];
  readonly shortcuts?: readonly ShortcutContribution<CommandDefinition<unknown, unknown>, TContext>[];
}

export interface PlatformReactContextValue<TContext = unknown> {
  readonly platform: Platform;
  readonly contributions: PlatformReactContributions<TContext>;
}

const PlatformReactContext = React.createContext<PlatformReactContextValue | null>(null);

export interface PlatformProviderProps<TContext = unknown> {
  readonly platform: Platform;
  readonly contributions?: PlatformReactContributions<TContext>;
  readonly children: React.ReactNode;
}

export function PlatformProvider<TContext = unknown>({
  platform,
  contributions,
  children,
}: PlatformProviderProps<TContext>) {
  const value = React.useMemo<PlatformReactContextValue<TContext>>(
    () => ({ platform, contributions: contributions ?? {} }),
    [contributions, platform],
  );
  return <PlatformReactContext.Provider value={value}>{children}</PlatformReactContext.Provider>;
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
