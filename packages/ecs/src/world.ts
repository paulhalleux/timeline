import { Component, ComponentStore } from "./component";
import { System } from "./system";
import { ReactiveSystem } from "./reactive-system";

export type Entity = number;
export type StructureListener = (component?: Component<string, any>) => void;
export type ComponentListener = (
  entity: Entity,
  component: Component<string, any>,
) => void;

export class World {
  private nextEntity: Entity = 0;

  private entitiesSet = new Set<Entity>();
  private components = new Map<Entity, Map<string, ComponentStore<any>>>();

  private structureListeners = new Set<StructureListener>();
  private componentListeners = new Set<ComponentListener>();

  private batchLevel = 0;
  private pendingComponentEmits = new Set<ComponentStore<any>>();
  private pendingComponentChangeEmits = new Set<{
    entity: Entity;
    component: Component<string, any>;
  }>();
  private pendingStructureEmits = new Set<Component<string, any> | undefined>();

  private reactiveSystems = new Set<ReactiveSystem<any>>();

  /* -------------------- systems -------------------- */

  addSystem(system: System): void {
    if (system.kind === "reactive") {
      this.reactiveSystems.add(system);
    }

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
    this.queueStructureEmit();
    return e;
  }

  destroyEntity(entity: Entity): void {
    this.entitiesSet.delete(entity);
    this.components.delete(entity);
    this.queueStructureEmit();
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

    this.queueStructureEmit(component);
    return value;
  }

  removeComponent(entity: Entity, component: Component<any, any>): void {
    const map = this.components.get(entity);
    if (!map) return;

    if (map.delete(component.name)) {
      this.queueStructureEmit(component);
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
    updater: (value: T) => void,
  ): void {
    const store = this.components.get(entity)?.get(component.name);
    if (!store) return;

    updater(store.value);
    store.value = { ...store.value };

    this.queueComponentEmit(store);
    this.queueComponentChangeEmit(entity, component);
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

  subscribeComponentChange(listener: ComponentListener): () => void {
    this.componentListeners.add(listener);
    return () => this.componentListeners.delete(listener);
  }

  private emitComponentChangeListeners(
    entity: Entity,
    component: Component<string, any>,
  ) {
    for (const l of this.componentListeners) {
      l(entity, component);
    }
  }

  private emitComponentChange(store: ComponentStore<any>) {
    for (const l of store.listeners) {
      l(store.value);
    }
  }

  /* -------------------- structure -------------------- */

  subscribeStructure(listener: StructureListener): () => void {
    this.structureListeners.add(listener);
    return () => this.structureListeners.delete(listener);
  }

  private emitStructureChange(component?: Component<string, any>) {
    for (const l of this.structureListeners) {
      l(component);
    }
  }

  /* --------------- batch API ---------------- */

  batch(fn: () => void) {
    this.batchLevel++;
    try {
      fn();
    } finally {
      this.batchLevel--;
      if (this.batchLevel === 0) {
        this.flushPendingEmits();
      }
    }
  }

  private queueComponentChangeEmit(
    entity: Entity,
    component: Component<string, any>,
  ) {
    if (this.batchLevel > 0) {
      this.pendingComponentChangeEmits.add({ entity, component });
    } else {
      this.emitComponentChangeListeners(entity, component);
    }
  }

  private queueComponentEmit(store: ComponentStore<any>) {
    if (this.batchLevel > 0) {
      this.pendingComponentEmits.add(store);
    } else {
      this.emitComponentChange(store);
    }
  }

  private queueStructureEmit(component?: Component<string, any>) {
    if (this.batchLevel > 0) {
      this.pendingStructureEmits.add(component);
    } else {
      this.emitStructureChange(component);
    }
  }

  private flushPendingEmits() {
    for (const store of this.pendingComponentEmits) {
      this.emitComponentChange(store);
    }
    this.pendingComponentEmits.clear();

    for (const component of this.pendingStructureEmits) {
      this.emitStructureChange(component);
    }
    this.pendingStructureEmits.clear();

    for (const { entity, component } of this.pendingComponentChangeEmits) {
      this.emitComponentChangeListeners(entity, component);
    }
    this.pendingComponentChangeEmits.clear();
  }
}
