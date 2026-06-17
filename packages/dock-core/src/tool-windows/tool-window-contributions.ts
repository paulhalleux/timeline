import {
  PlatformError,
  disposable,
  type ContributionOwner,
  type Disposable,
  type LocalizedText,
} from "@ptl/platform-core";

import type { DockedPlacement, ToolWindowState } from "../layout-state";
import { dockErrorCodes } from "../errors";

export interface ToolWindowConstraints {
  canHide?: boolean;
  canMove?: boolean;
  canFloat?: boolean;
  canPopout?: boolean;
  allowedPlacements?: readonly DockedPlacement[];
  minWidth?: number;
  minHeight?: number;
}

export interface ToolWindowContribution<TMeta = unknown> {
  id: string;
  title: LocalizedText;
  icon?: string;
  component: string;
  headerComponent?: string;
  preferredPlacement?: DockedPlacement;
  constraints?: ToolWindowConstraints;
  metadata?: TMeta;
  owner?: ContributionOwner;
}

export type ToolWindowContributionSource =
  | readonly ToolWindowContribution[]
  | { get(id: string): ToolWindowContribution | undefined };

export function getToolWindowContribution(
  source: ToolWindowContributionSource | undefined,
  id: string,
): ToolWindowContribution | undefined {
  if (!source) {
    return undefined;
  }

  return Array.isArray(source)
    ? source.find((contribution) => contribution.id === id)
    : source.get(id);
}

/**
 * Stores generic tool-window contributions from plugins or host defaults.
 *
 * The contribution carries a component ID, not a React component. Rendering
 * remains a responsibility of `dock-react` or the host application.
 *
 * Prefer passing plain `ToolWindowContribution[]` manifests to app-owned dock
 * setup. Keep this registry for dynamic plugin contribution lifecycles.
 *
 * @example
 * ```ts
 * const registry = new ToolWindowContributionRegistry();
 * const disposable = registry.register({
 *   id: "timeline.outline",
 *   title: "Outline",
 *   component: "dock.tool.outline",
 *   preferredPlacement: "left-top",
 * });
 * ```
 */
export class ToolWindowContributionRegistry {
  private readonly toolWindows = new Map<string, ToolWindowContribution>();

  register<TMeta>(contribution: ToolWindowContribution<TMeta>): Disposable {
    if (this.toolWindows.has(contribution.id)) {
      throw new PlatformError({
        code: dockErrorCodes.toolWindowAlreadyRegistered,
        message: `Tool window "${contribution.id}" is already registered`,
        details: { id: contribution.id },
      });
    }

    this.toolWindows.set(contribution.id, contribution as ToolWindowContribution);

    return disposable(() => {
      if (this.toolWindows.get(contribution.id) === contribution) {
        this.toolWindows.delete(contribution.id);
      }
    });
  }

  get(id: string): ToolWindowContribution | undefined {
    return this.toolWindows.get(id);
  }

  getAll(): ToolWindowContribution[] {
    return [...this.toolWindows.values()];
  }
}

export function createToolWindowState(contribution: ToolWindowContribution): ToolWindowState {
  return {
    id: contribution.id,
    title:
      typeof contribution.title === "string"
        ? contribution.title
        : contribution.title.defaultMessage,
    component: contribution.component,
    headerComponent: contribution.headerComponent,
    placement: contribution.preferredPlacement ?? "left-top",
    metadata: contribution.metadata,
  };
}
