export { CommandPalette, type CommandPaletteProps } from "./components/command-palette";
export {
  MenuBar,
  PlatformContextMenu,
  PlatformMenu,
  type MenuBarProps,
  type PlatformContextMenuProps,
  type PlatformMenuProps,
} from "./components/platform-menu";
export { ShortcutProvider, type ShortcutProviderProps } from "./components/shortcut-provider";
export {
  PlatformProvider,
  usePlatform,
  type PlatformProviderProps,
  type PlatformReactContextValue,
  type PlatformReactContributions,
} from "./hooks/platform-provider";
export {
  createReactComponentRegistry,
  ReactComponentRegistry,
  reactComponentRegistryErrorCodes,
  type ReactComponentRegistryEntries,
} from "./registry/react-component-registry";
export type { SearchableCommand } from "./utils/searchable-command";
export type { ShortcutConflict } from "./utils/shortcut-conflicts";
