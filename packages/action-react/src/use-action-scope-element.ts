import { useCallback, useId, useRef } from "react";
import type { ActionScopeElement } from "@ptl/action-core";
import { createHTMLElementScopeElement } from "./html-scope-element";

export interface UseActionScopeElementOptions {
  id?: string;
  active?: boolean | (() => boolean);
  metadata?: Readonly<Record<string, unknown>>;
}

export interface UseActionScopeElementResult<TElement extends HTMLElement> {
  ref: (element: TElement | null) => void;
  scopeElementId: string;
}

/**
 * Registers a React HTMLElement as an action scope element.
 *
 * Use the returned `ref` on the focusable region that should own scoped
 * shortcuts and scoped context-menu invocations.
 */
export function useActionScopeElement<TElement extends HTMLElement>(
  registerElement: (element: ActionScopeElement) => () => void,
  options: UseActionScopeElementOptions = {},
): UseActionScopeElementResult<TElement> {
  const reactId = useId();
  const scopeElementId = options.id ?? reactId;
  const unregisterRef = useRef<(() => void) | undefined>(undefined);

  const ref = useCallback(
    (element: TElement | null) => {
      unregisterRef.current?.();
      unregisterRef.current = undefined;

      if (!element) return;

      unregisterRef.current = registerElement(
        createHTMLElementScopeElement({
          id: scopeElementId,
          element,
          active: options.active,
          metadata: options.metadata,
        }),
      );
    },
    [options.active, options.metadata, registerElement, scopeElementId],
  );

  return { ref, scopeElementId };
}
