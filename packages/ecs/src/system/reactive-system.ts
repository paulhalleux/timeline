import { QueryInstance } from "../query-instance";
import { ComponentsOf } from "../component";
import { World } from "../world";
import { QueryComponents, QueryBuilder } from "../query";
import { SystemBase } from "./index";
import { Entity } from "../entity";
import { Signal } from "@ptl/signal";

export type ReactiveSystem = SystemBase<"reactive", {}>;

/**
 * Creates a reactive system that responds to changes in entities matching the specified queries.
 * @param query - The query that triggers the reactive system on changes.
 * @param handlers - The handlers for enter, exit, and update events.
 * @param dependencies - External signal dependencies that can trigger the system.
 * @returns A reactive system instance.
 */
export const createReactiveSystem = <T extends QueryComponents>(
  query: QueryBuilder<T>,
  handlers: {
    onEnter?(world: World, entity: Entity, components: ComponentsOf<T>): void;
    onExit?(world: World, entity: Entity, components: ComponentsOf<T>): void;
    onUpdate?(world: World, entity: Entity, components: ComponentsOf<T>): void;
  },
  dependencies: Signal<any>[] = [],
): ReactiveSystem => {
  let worldRef: World | null = null;
  let queryInstance: QueryInstance<T>;

  let cleanup: Array<() => void> = [];

  const forceUpdate = () => {
    if (!queryInstance || !worldRef || !handlers.onUpdate) {
      return;
    }

    for (const entity of queryInstance.get()) {
      handlers.onUpdate(worldRef, entity, queryInstance.getComponents(entity));
    }
  };

  const attach = (world: World) => {
    worldRef = world;
    queryInstance = new QueryInstance<T>(world, query);

    const unsubscribe = queryInstance.subscribe(
      ({ updated, entered, exited }) => {
        if (!world) {
          return;
        }

        for (const entity of entered) {
          handlers.onEnter?.(
            world,
            entity,
            queryInstance.getComponents(entity),
          );
        }

        for (const entity of exited) {
          handlers.onExit?.(world, entity, queryInstance.getComponents(entity));
        }

        for (const entity of updated) {
          handlers.onUpdate?.(
            world,
            entity,
            queryInstance.getComponents(entity),
          );
        }
      },
    );

    cleanup.push(
      unsubscribe,
      ...dependencies.map((dependency) => dependency.subscribe(forceUpdate)),
    );
  };

  return {
    kind: "reactive",
    attach,
    detach() {
      cleanup.forEach((fn) => fn());
      queryInstance?.destroy();
    },
  };
};
