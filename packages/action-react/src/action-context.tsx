import { createContext, useContext } from "react";
import type { ActionRunner } from "./action-runner";

export interface ActionSurfaceContextValue {
  id: string;
  element: HTMLElement | null;
}

export const ActionRunnerContext = createContext<ActionRunner | undefined>(
  undefined,
);

export const ActionSurfaceContext = createContext<
  ActionSurfaceContextValue | undefined
>(undefined);

export function useActionRunner(runner?: ActionRunner): ActionRunner {
  const contextRunner = useContext(ActionRunnerContext);
  const resolvedRunner = runner ?? contextRunner;

  if (!resolvedRunner) {
    throw new Error(
      "Action runner is required. Pass a runner or wrap the tree in <Actions.Provider>.",
    );
  }

  return resolvedRunner;
}

export function useCurrentActionSurface(): ActionSurfaceContextValue | undefined {
  return useContext(ActionSurfaceContext);
}
