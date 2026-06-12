import type { ActionSurface } from "@ptl/action-core";

export interface HTMLElementActionSurfaceOptions {
  id: string;
  element: HTMLElement;
  active?: boolean | (() => boolean);
  metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Creates an action-core ActionSurface backed by a concrete HTMLElement.
 *
 * The element matches invocations whose event target is contained by the
 * HTMLElement. Without an event target, it is considered active when focus is
 * inside the HTMLElement unless an explicit `active` option is provided.
 */
export function createHTMLElementActionSurface(
  options: HTMLElementActionSurfaceOptions,
): ActionSurface {
  return {
    id: options.id,
    metadata: options.metadata,
    containsTarget: (target) => isContainedTarget(options.element, target),
    isActive: () => isHTMLElementSurfaceActive(options),
  };
}

function isContainedTarget(element: HTMLElement, target: unknown): boolean {
  if (!isNode(target)) return false;
  return element === target || element.contains(target);
}

function isHTMLElementSurfaceActive(
  options: HTMLElementActionSurfaceOptions,
): boolean {
  if (typeof options.active === "boolean") return options.active;
  if (typeof options.active === "function") return options.active();

  const activeElement = options.element.ownerDocument.activeElement;
  return isContainedTarget(options.element, activeElement);
}

function isNode(value: unknown): value is Node {
  return typeof Node === "function" && value instanceof Node;
}
