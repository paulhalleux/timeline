import { useCallback, useId, useRef } from "react";
import type { ActionSurface } from "@ptl/action-core";
import { createHTMLElementActionSurface } from "./html-action-surface";

export interface UseActionSurfaceOptions {
  id?: string;
  active?: boolean | (() => boolean);
  metadata?: Readonly<Record<string, unknown>>;
}

export interface UseActionSurfaceResult<TElement extends HTMLElement> {
  ref: (element: TElement | null) => void;
  surfaceId: string;
}

/**
 * Registers a React HTMLElement as an action surface.
 *
 * Use the returned `ref` on the focusable region that should own local
 * shortcuts and surface-aware context-menu invocations.
 */
export function useActionSurface<TElement extends HTMLElement>(
  registerSurface: (surface: ActionSurface) => () => void,
  options: UseActionSurfaceOptions = {},
): UseActionSurfaceResult<TElement> {
  const reactId = useId();
  const surfaceId = options.id ?? reactId;
  const unregisterRef = useRef<(() => void) | undefined>(undefined);

  const ref = useCallback(
    (element: TElement | null) => {
      unregisterRef.current?.();
      unregisterRef.current = undefined;

      if (!element) return;

      unregisterRef.current = registerSurface(
        createHTMLElementActionSurface({
          id: surfaceId,
          element,
          active: options.active,
          metadata: options.metadata,
        }),
      );
    },
    [options.active, options.metadata, registerSurface, surfaceId],
  );

  return { ref, surfaceId };
}
