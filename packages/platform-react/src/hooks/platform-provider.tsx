import {
  type ContributionReader,
  type ExtensionPoint,
  type ServiceToken,
  PlatformRuntime,
  type MenuContribution,
  type MenuRootContribution,
  type ShortcutContribution,
} from "@ptl/platform-core";
import * as React from "react";

import { ReactComponentRegistry } from "../registry/react-component-registry";

export interface PlatformReactContributions<TContext = unknown> {
  menuRoots?: readonly MenuRootContribution<string, TContext>[];
  menus?: readonly MenuContribution<string, any, TContext>[];
  shortcuts?: readonly ShortcutContribution<any, TContext>[];
}

export interface PlatformReactContextValue<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TContext = unknown,
> {
  platform: PlatformRuntime<TServices> | { commands: PlatformRuntime<TServices>["commands"]; i18n: PlatformRuntime<TServices>["i18n"]; get?<T>(token: ServiceToken<T>): T; contributions?: ContributionReader; };
  components: ReactComponentRegistry;
  contributions: PlatformReactContributions<TContext>;
}

const PlatformReactContext = React.createContext<PlatformReactContextValue<any, any> | null>(null);

export interface PlatformProviderProps<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TContext = unknown,
> {
  platform: PlatformRuntime<TServices> | { commands: PlatformRuntime<TServices>["commands"]; i18n: PlatformRuntime<TServices>["i18n"]; get?<T>(token: ServiceToken<T>): T; contributions?: ContributionReader; };
  components?: ReactComponentRegistry;
  contributions?: PlatformReactContributions<TContext>;
  children: React.ReactNode;
}

/**
 * Provides a platform runtime and React-only registries to component trees.
 *
 * @example
 * ```tsx
 * <PlatformProvider platform={platform}>
 *   <MenuBar menu="main" />
 * </PlatformProvider>
 * ```
 */
export function PlatformProvider<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TContext = unknown,
>({ platform, components, contributions, children }: PlatformProviderProps<TServices, TContext>) {
  const defaultComponents = React.useMemo(() => new ReactComponentRegistry(), []);
  const value = React.useMemo<PlatformReactContextValue<TServices, TContext>>(
    () => ({
      platform,
      components: components ?? defaultComponents,
      contributions: contributions ?? {},
    }),
    [components, contributions, defaultComponents, platform],
  );

  return <PlatformReactContext.Provider value={value}>{children}</PlatformReactContext.Provider>;
}

/**
 * Read the platform React adapter context.
 *
 * This is intentionally the only hook exported by `@ptl/platform-react`.
 * Callers can destructure the runtime and React-only registries they need from
 * one stable place:
 *
 * @example
 * ```tsx
 * const { platform, contributions, components } = usePlatform();
 * const commands = platform.commands.getAll();
 * ```
 */
export function usePlatform<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TContext = unknown,
>(): PlatformReactContextValue<TServices, TContext> {
  const context = React.useContext(PlatformReactContext);
  if (!context) {
    throw new Error("Platform hooks must be used inside <PlatformProvider>.");
  }

  return context as PlatformReactContextValue<TServices, TContext>;
}

export function useService<T>(token: ServiceToken<T>): T {
  const { platform } = usePlatform();
  if (!("get" in platform) || !platform.get) {
    throw new Error("The current platform does not expose typed service lookup.");
  }
  return platform.get(token);
}

export function useContributions<T>(point: ExtensionPoint<T>): readonly T[] {
  const { platform } = usePlatform();
  const reader = "contributions" in platform ? platform.contributions : undefined;
  const [values, setValues] = React.useState<readonly T[]>(() => reader?.getAll(point) ?? []);
  React.useEffect(() => {
    if (!reader) return undefined;
    setValues(reader.getAll(point));
    return reader.subscribe(point, setValues).dispose;
  }, [point, reader]);
  return values;
}

export function useCommand<TInput, TResult>(command: import("@ptl/platform-core").CommandDefinition<TInput, TResult>) {
  const { platform } = usePlatform();
  return React.useCallback((input: TInput, options?: { readonly signal?: AbortSignal }) => {
    if ("execute" in platform && typeof platform.execute === "function") {
      return platform.execute(command, input, options);
    }
    return platform.commands.execute(command, input, options);
  }, [command, platform]);
}
