import type { PropsWithChildren } from "react";
import type { ActionRunner } from "./action-runner";
import { ActionRunnerContext } from "./action-context";

export interface ActionProviderProps extends PropsWithChildren {
  runner: ActionRunner;
}

export function ActionProvider(props: ActionProviderProps) {
  return (
    <ActionRunnerContext.Provider value={props.runner}>
      {props.children}
    </ActionRunnerContext.Provider>
  );
}
