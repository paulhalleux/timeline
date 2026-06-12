import type {
  ActionDescriptor,
  ActionInvocation,
  ActionRunResult,
  ActionState,
} from "@ptl/action-core";

export interface ActionRunner {
  list(): readonly ActionDescriptor[];
  get(id: ActionDescriptor["id"]): ActionDescriptor | undefined;
  getState?(id: ActionDescriptor["id"]): ActionState;
  run(
    id: ActionDescriptor["id"],
    invocation: ActionInvocation,
  ): Promise<ActionRunResult>;
}
