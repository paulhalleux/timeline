import { Component, ComponentStore } from "./component";

export type Entity = number;
export type StructureListener = (component?: Component<any>) => void;

export class World {
  private nextEntity: Entity = 0;

  private entitiesSet = new Set<Entity>();
  private components = new Map<Entity, Map<string, ComponentStore<any>>>();

  private structureListeners = new Set<StructureListener>();

  private batchLevel = 0;
  private pendingComponentEmits = new Set<ComponentStore<any>>();
  private pendingStructureEmits = new Set<Component<any> | undefined>();

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
    component: Component<T>,
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

  removeComponent(entity: Entity, component: Component<any>): void {
    const map = this.components.get(entity);
    if (!map) return;

    if (map.delete(component.name)) {
      this.queueStructureEmit(component);
    }
  }

  hasComponent(entity: Entity, component: Component<any>): boolean {
    return !!this.components.get(entity)?.has(component.name);
  }

  getComponent<T>(entity: Entity, component: Component<T>): T | undefined {
    return this.components.get(entity)?.get(component.name)?.value;
  }

  updateComponent<T>(
    entity: Entity,
    component: Component<T>,
    updater: (value: T) => void,
  ): void {
    const store = this.components.get(entity)?.get(component.name);
    if (!store) return;

    updater(store.value);
    store.value = { ...store.value };

    this.queueComponentEmit(store);
  }

  subscribeComponent<T>(
    entity: Entity,
    component: Component<T>,
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

  private emitStructureChange(component?: Component<any>) {
    console.log("emitStructureChange", component?.name);
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

  private queueComponentEmit(store: ComponentStore<any>) {
    if (this.batchLevel > 0) {
      this.pendingComponentEmits.add(store);
    } else {
      this.emitComponentChange(store);
    }
  }

  private queueStructureEmit(component?: Component<any>) {
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
  }
}
