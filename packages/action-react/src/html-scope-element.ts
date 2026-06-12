import type { ActionScopeElement } from "@ptl/action-core";

export interface HTMLElementScopeElementOptions {
  id: string;
  element: HTMLElement;
  active?: boolean | (() => boolean);
  metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Creates an action-core scope element backed by a concrete HTMLElement.
 *
 * The element matches invocations whose event target is contained by the
 * HTMLElement. Without an event target, it is considered active when focus is
 * inside the HTMLElement unless an explicit `active` option is provided.
 */
export function createHTMLElementScopeElement(
  options: HTMLElementScopeElementOptions,
): ActionScopeElement {
  return {
    id: options.id,
    metadata: options.metadata,
    containsTarget: (target) => isContainedTarget(options.element, target),
    isActive: () => isHTMLElementScopeActive(options),
  };
}

function isContainedTarget(element: HTMLElement, target: unknown): boolean {
  if (!isNode(target)) return false;
  return element === target || element.contains(target);
}

function isHTMLElementScopeActive(
  options: HTMLElementScopeElementOptions,
): boolean {
  if (typeof options.active === "boolean") return options.active;
  if (typeof options.active === "function") return options.active();

  const activeElement = options.element.ownerDocument.activeElement;
  return isContainedTarget(options.element, activeElement);
}

function isNode(value: unknown): value is Node {
  return typeof Node === "function" && value instanceof Node;
}
