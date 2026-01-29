import { isEqual } from "es-toolkit";

import { type Component, type ComponentStore } from "./component";
import { type Entity } from "./entity";
import {
  type QueryBuilder,
  type QueryComponents,
  QueryInstance,
} from "./query";
import {
  StructuralChangeEmitter,
  type StructuralChangeListener,
} from "./structural-change";
import { type ReactiveSystem, type System } from "./system";

export class World {
  private nextEntity: Entity = 0;
  private entitiesSet = new Set<Entity>();
  private components = new Map<Entity, Map<string, ComponentStore<any>>>();
  private structuralChangeEmitter = new StructuralChangeEmitter();
  private reactiveSystems = new Set<ReactiveSystem>();

  /* -------------------- systems -------------------- */

  addSystem(system: System): void {
    if (system.kind === "reactive") {
      this.reactiveSystems.add(system);
    }

    system.detach(); // Ensure the system is detached before attaching to this world
    system.attach(this);
  }

  removeSystem(system: System): void {
    system.detach();
    if (system.kind === "reactive") {
      this.reactiveSystems.delete(system);
    }
  }

  /* -------------------- entities -------------------- */

  createEntity(): Entity {
    const e = ++this.nextEntity;
    this.entitiesSet.add(e);
    this.structuralChangeEmitter.emit({
      type: "create",
      entity: e,
      component: null,
    });
    return e;
  }

  destroyEntity(entity: Entity): void {
    this.entitiesSet.delete(entity);
    this.components.delete(entity);
    this.structuralChangeEmitter.emit({
      type: "destroy",
      entity,
      component: null,
    });
  }

  entities(): Iterable<Entity> {
    return this.entitiesSet;
  }

  /* -------------------- components -------------------- */

  addComponent<T>(
    entity: Entity,
    component: Component<string, T>,
    initial?: Partial<T>,
  ): T {
    let map = this.components.get(entity);
    if (!map) {
      map = new Map();
      this.components.set(entity, map);
    }

    const value = component.create(initial);
    map.set(component.name, {
      value,
      listeners: new Set(),
    });

    this.structuralChangeEmitter.emit({
      type: "add",
      entity,
      component,
      value,
    });

    return value;
  }

  removeComponent(entity: Entity, component: Component<any, any>): void {
    const map = this.components.get(entity);
    if (!map) return;

    if (map.delete(component.name)) {
      this.structuralChangeEmitter.emit({
        type: "remove",
        entity,
        component,
      });
    }
  }

  hasComponent(entity: Entity, component: Component<any, any>): boolean {
    return !!this.components.get(entity)?.has(component.name);
  }

  getComponent<T>(
    entity: Entity,
    component: Component<string, T>,
  ): T | undefined {
    return this.getComponentByName<T>(entity, component.name);
  }

  getComponentByName<T>(entity: Entity, name: string): T | undefined {
    return this.components.get(entity)?.get(name)?.value;
  }

  updateComponent<T>(
    entity: Entity,
    component: Component<string, T>,
    updater: (value: T) => T,
  ): void {
    const store = this.components.get(entity)?.get(component.name);
    if (!store) return;

    const previousValue = store.value;
    store.value = updater(structuredClone(store.value));
    if (!isEqual(previousValue, store.value)) {
      store.listeners.forEach((listener) => listener(store.value));
    }

    this.structuralChangeEmitter.emit({
      type: "update",
      entity,
      component,
      value: store.value,
    });
  }

  subscribeComponent<T>(
    entity: Entity,
    component: Component<string, T>,
    listener: (value: T) => void,
  ): () => void {
    const store = this.components.get(entity)?.get(component.name);
    if (!store) return () => {};

    store.listeners.add(listener);
    listener(store.value);

    return () => {
      store.listeners.delete(listener);
    };
  }

  /* -------------------- subscription -------------------- */

  /**
   * Subscribes to entity creation and destruction events.
   * @param listener - A callback function that receives the entity involved in the event.
   * @returns A function to unsubscribe from the events.
   */
  subscribeToEntities(listener: (entity: Entity) => void): () => void {
    return this.structuralChangeEmitter.subscribe((change) => {
      if (!(change.type === "create" || change.type === "destroy")) {
        return;
      }

      listener(change.entity);
    });
  }

  /**
   * Subscribes to component addition, removal, and update events.
   * @param listener - A callback function that receives the entity and component involved in the event.
   * @returns A function to unsubscribe from the events.
   */
  subscribeToComponentChange(
    listener: (entity: Entity, component: Component<string, any>) => void,
  ): () => void {
    return this.structuralChangeEmitter.subscribe((change) => {
      if (
        !(
          change.type === "add" ||
          change.type === "remove" ||
          change.type === "update"
        )
      ) {
        return;
      }

      listener(change.entity, change.component!);
    });
  }

  /**
   * Subscribes to all structural change events in the world.
   * @param listener - A callback function that receives the structural change event.
   * @returns A function to unsubscribe from the events.
   */
  subscribe(listener: StructuralChangeListener): () => void {
    return this.structuralChangeEmitter.subscribe(listener);
  }

  /* -------------------- queries -------------------- */

  /**
   * Creates a new QueryInstance based on the provided QueryBuilder.
   * @param query - The QueryBuilder defining the query criteria.
   * @returns A new QueryInstance for the specified query.
   */
  createQuery<T extends QueryComponents>(query: QueryBuilder<T>) {
    return new QueryInstance(this, query);
  }
}
