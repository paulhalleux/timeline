import { resolveReactComponent, usePlatform } from "@ptl/platform-react";
import type { ToolWindowState, DockApi, WorkspaceItemState } from "@ptl/dock-core";
import type React from "react";

import { useDock } from "../provider/dock-provider";
import { DockLayout, type DockLayoutProps } from "./dock-layout";

export interface DockToolWindowComponentProps {
  toolWindow: ToolWindowState;
  dock: DockApi;
}

export interface DockToolWindowHeaderComponentProps {
  toolWindow: ToolWindowState;
  dock: DockApi;
}

export interface DockWorkspaceItemComponentProps {
  item: WorkspaceItemState;
  dock: DockApi;
}

export interface DockResolvedLayoutProps extends Omit<
  DockLayoutProps,
  "renderToolWindow" | "renderToolWindowHeader" | "renderWorkspaceItem"
> {
  renderMissingComponent?: (componentId: string) => React.ReactNode;
}

/**
 * Render dock items by resolving component IDs from `platform-react`.
 *
 * @example
 * ```tsx
 * components={{ "dock.editor": EditorPane }}
 * <DockResolvedLayout />
 * ```
 */
export function DockResolvedLayout({
  renderMissingComponent,
  ...layoutProps
}: DockResolvedLayoutProps) {
  const { components } = usePlatform();
  const dock = useDock();

  return (
    <DockLayout
      {...layoutProps}
      renderToolWindow={(toolWindow) => {
        const Component = resolveReactComponent<DockToolWindowComponentProps>(
          components,
          toolWindow.component,
        );

        return Component ? (
          <Component toolWindow={toolWindow} dock={dock} />
        ) : (
          (renderMissingComponent?.(toolWindow.component) ?? (
            <MissingComponent componentId={toolWindow.component} />
          ))
        );
      }}
      renderToolWindowHeader={(toolWindow) => {
        const headerComponent = toolWindow.headerComponent;

        if (!headerComponent) {
          return undefined;
        }

        const Component = resolveReactComponent<DockToolWindowHeaderComponentProps>(
          components,
          headerComponent,
        );

        return Component ? (
          <Component toolWindow={toolWindow} dock={dock} />
        ) : (
          (renderMissingComponent?.(headerComponent) ?? (
            <MissingComponent componentId={headerComponent} />
          ))
        );
      }}
      renderWorkspaceItem={(item) => {
        const Component = resolveReactComponent<DockWorkspaceItemComponentProps>(
          components,
          item.component,
        );

        return Component ? (
          <Component item={item} dock={dock} />
        ) : (
          (renderMissingComponent?.(item.component) ?? (
            <MissingComponent componentId={item.component} />
          ))
        );
      }}
    />
  );
}

/**
 * Fallback renderer shown when a registered dock component is missing.
 *
 * @param props - Missing component id.
 * @returns Diagnostic placeholder for the unresolved component.
 */
function MissingComponent({ componentId }: { componentId: string }) {
  return (
    <div className="flex min-h-16 items-center justify-center border border-dashed p-3 text-sm text-muted-foreground">
      Missing component: {componentId}
    </div>
  );
}
