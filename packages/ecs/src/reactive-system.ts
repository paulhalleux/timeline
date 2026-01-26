import { QueryInstance } from "./query-instance";
import { ComponentsOf } from "./component";
import { Entity, World } from "./world";
import { _QueryList, QueryBuilder } from "./query";
import { SystemBase } from "./system";

export type ReactiveSystem<T extends _QueryList> = SystemBase<
  "reactive",
  {
    getQuery(): QueryInstance<T> | undefined;
    onEnter?(world: World, entity: Entity, components: ComponentsOf<T>): void;
    onExit?(world: World, entity: Entity, components: ComponentsOf<T>): void;
    onUpdate?(world: World, entity: Entity, components: ComponentsOf<T>): void;
  }
>;

export const createReactiveSystem = <T extends _QueryList>(
  changeQuery: QueryBuilder<T>,
  updateQuery: QueryBuilder<any>,
  handlers: Pick<ReactiveSystem<T>, "onEnter" | "onExit" | "onUpdate">,
): ReactiveSystem<T> => {
  const previousEntities = new Set<Entity>();
  let unsubscribe: () => void = () => {};
  let changeQueryInstance: QueryInstance<T>;
  let updateQueryInstance: QueryInstance<any>;

  const attach = (world: World) => {
    changeQueryInstance = new QueryInstance<T>(world, changeQuery);
    updateQueryInstance = new QueryInstance<any>(world, updateQuery);

    unsubscribe = changeQueryInstance.subscribe(() => {
      if (!world) {
        return;
      }

      const currentEntities = new Set<Entity>(updateQueryInstance.get());

      // detect entered entities
      for (const entity of currentEntities) {
        if (!previousEntities.has(entity)) {
          const components = changeQueryInstance.getComponents(entity);
          handlers.onEnter?.(world, entity, components);
        }
      }

      // detect exited entities
      for (const entity of previousEntities) {
        if (!currentEntities.has(entity)) {
          const components = changeQueryInstance.getComponents(entity);
          handlers.onExit?.(world, entity, components);
        }
      }

      // update all current entities
      for (const entity of currentEntities) {
        const components = changeQueryInstance.getComponents(entity);
        handlers.onUpdate?.(world, entity, components);
      }

      // update previousEntities for next frame
      previousEntities.clear();
      for (const entity of currentEntities) {
        previousEntities.add(entity);
      }
    });
  };

  return {
    kind: "reactive",
    getQuery() {
      return changeQueryInstance;
    },
    onEnter: handlers.onEnter,
    onExit: handlers.onExit,
    onUpdate: handlers.onUpdate,
    attach,
    detach() {
      unsubscribe();
      updateQueryInstance?.destroy();
      changeQueryInstance?.destroy();
      previousEntities.clear();
    },
  };
};
