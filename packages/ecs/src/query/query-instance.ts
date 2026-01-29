import { World } from "../world";
import { ComponentsOf } from "../component";
import { Entity } from "../entity";
import { StructuralChange } from "../structural-change";
import { Signal, SignalSubscriber, WritableSignal } from "@ptl/signal";
import { QueryBuilder, QueryComponents } from "./query-builder";
import { collectQueryComponents, matchQuery, QueryExpr } from "./query-utils";

/**
 * Represents the difference between two query results.
 */
export type QueryDiff = {
  entered: readonly Entity[];
  exited: readonly Entity[];
  updated: readonly Entity[];
};

/**
 * A listener function that handles query result differences.
 */
export type QueryInstanceListener = (
  diff: QueryDiff,
  entities: readonly Entity[],
) => void;

/**
 * An instance of a query that can be used to retrieve entities matching the query.
 */
export class QueryInstance<T extends QueryComponents> implements Signal<Entity[]> {
  private entities: Entity[] = [];
  private diffListeners = new Set<QueryInstanceListener>();
  private entityListeners = new Set<SignalSubscriber<Entity[]>>();
  private deps: Set<string>;

  private readonly expr: QueryExpr;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly world: World,
    builder: QueryBuilder<T>,
  ) {
    this.expr = builder.build();
    this.deps = collectQueryComponents(this.expr);

    this.unsubscribe = world.subscribe((change) => {
      this.recompute(change);
    });

    this.init();
  }

  /**
   * Initializes the query instance by evaluating the query expression
   * against all entities in the world.
   * @private
   */
  private init() {
    const next: Entity[] = [];

    for (const e of this.world.entities()) {
      if (matchQuery(this.world, e, this.expr)) {
        next.push(e);
      }
    }

    this.entities = next;
    this.emit({
      entered: next,
      exited: [],
      updated: [],
    });
  }

  /**
   * Recomputes the query results based on a structural change in the world.
   * @param change - The structural change that occurred.
   * @private
   */
  private recompute(change: StructuralChange) {
    const entity = change.entity;
    const matches = matchQuery(this.world, entity, this.expr);
    const index = this.entities.indexOf(entity);
    const exists = index !== -1;

    const entered: Entity[] = [];
    const exited: Entity[] = [];
    const updated: Entity[] = [];

    if (matches && !exists) {
      // entity entered the query
      this.entities.push(entity);
      entered.push(entity);
    } else if (!matches && exists) {
      // entity exited the query
      this.entities.splice(index, 1);
      exited.push(entity);
    } else if (matches && exists) {
      // entity updated within the query
      updated.push(entity);
    }

    if (entered.length > 0 || exited.length > 0 || updated.length > 0) {
      this.emit({
        entered,
        exited,
        updated,
      });
    }

    for (const l of this.entityListeners) {
      l(this.entities);
    }
  }

  /**
   * Retrieves the entities matching the query.
   * @returns An array of entities matching the query.
   */
  get(): Entity[] {
    return this.entities;
  }

  /**
   * Subscribes a listener to query result changes.
   * @param listener - The listener function to subscribe.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: SignalSubscriber<Entity[]>): () => void {
    listener(this.entities);
    this.entityListeners.add(listener);
    return () => this.entityListeners.delete(listener);
  }

  /**
   * Subscribes a listener to query result differences.
   * @param listener - The listener function to subscribe.
   * @returns A function to unsubscribe the listener.
   */
  subscribeDiff(listener: QueryInstanceListener): () => void {
    this.diffListeners.add(listener);
    return () => this.diffListeners.delete(listener);
  }

  /**
   * Destroys the query instance.
   * - Unsubscribes from world changes.
   * - Clears all diffListeners.
   */
  destroy(): void {
    this.unsubscribe();
    this.diffListeners.clear();
  }

  /**
   * Retrieves the components of a given entity as specified by the query.
   * @param entity - The entity whose components are to be retrieved.
   * @returns An object containing the components of the entity.
   * @note This method assumes that the entity has the components specified in the query.
   */
  getComponents(entity: Entity): ComponentsOf<T> {
    return Array.from(this.deps.values()).reduce((acc, compName) => {
      const value = this.world.getComponentByName(entity, compName);
      // not that good
      acc[compName as keyof ComponentsOf<T>] = value as any;
      return acc;
    }, {} as ComponentsOf<T>);
  }

  /**
   * Emits a query difference to all subscribed diffListeners.
   * @param diff - The query difference to emit.
   * @private
   */
  private emit(diff: QueryDiff) {
    for (const l of this.diffListeners) l(diff, this.entities);
  }

  /**
   * Creates a new signal that emits whenever the predicate returns true for the current entities
   * @param predicate A function that takes the current entities and returns a boolean
   * @returns A new {@link Signal} that emits void when the predicate is satisfied
   */
  filter(predicate: (value: Entity[]) => boolean): Signal<void> {
    const filteredSignal = new WritableSignal<void>(undefined);

    this.subscribe((newValue) => {
      if (predicate(newValue)) {
        filteredSignal.emit();
      }
    });

    return filteredSignal;
  }

  /**
   * Mapping is not supported for QueryInstance.
   * @throws An error indicating that mapping is not supported.
   */
  map<U>(fn: (value: Entity[]) => U): Signal<U> {
    const derivedSignal = new WritableSignal<U>(fn(this.get()));
    this.subscribe((newValue) => {
      derivedSignal.set(fn(newValue));
    });
    return derivedSignal;
  }
}
