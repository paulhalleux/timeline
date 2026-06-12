import { useCallback, useRef, useState } from "react";
import type { HTMLAttributes, PropsWithChildren } from "react";
import { ActionSurfaceContext } from "./action-context";
import { createHTMLElementActionSurface } from "./html-action-surface";
import { useActionHotkeys } from "./use-action-hotkeys";
import { useActionRunner } from "./action-context";
import type { ActionRunner } from "./action-runner";

export interface ActionSurfaceProps
  extends PropsWithChildren,
    Omit<HTMLAttributes<HTMLElement>, "id"> {
  id: string;
  runner?: ActionRunner;
  active?: boolean | (() => boolean);
  metadata?: Readonly<Record<string, unknown>>;
  hotkeys?: boolean;
}

export function ActionSurface(props: ActionSurfaceProps) {
  const {
    id,
    runner: runnerProp,
    active,
    metadata,
    hotkeys = true,
    children,
    ...elementProps
  } = props;
  const runner = useActionRunner(runnerProp);
  const unregisterRef = useRef<(() => void) | undefined>(undefined);
  const [element, setElement] = useState<HTMLElement | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      unregisterRef.current?.();
      unregisterRef.current = undefined;
      setElement(node);

      if (!node) return;
      if (!runner.registerSurface) {
        throw new Error("Action runner does not support action surfaces.");
      }

      unregisterRef.current = runner.registerSurface(
        createHTMLElementActionSurface({
          id,
          element: node,
          active,
          metadata,
        }),
      );
    },
    [active, id, metadata, runner],
  );

  useActionHotkeys(runner, {
    enabled: hotkeys && element !== null,
    focus: "surface",
    surfaceId: id,
    target: element ?? undefined,
  });

  return (
    <ActionSurfaceContext.Provider value={{ id, element }}>
      <div {...elementProps} id={id} ref={ref}>
        {children}
      </div>
    </ActionSurfaceContext.Provider>
  );
}
