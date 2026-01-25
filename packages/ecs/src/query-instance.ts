import { Entity, World } from "./world";
import {
  _QueryList,
  collectQueryComponents,
  matchQuery,
  QueryBuilder,
  QueryExpr,
} from "./query";
import { ComponentsOf } from "./component";

export class QueryInstance<T extends _QueryList> {
  private entities: Entity[] = [];
  private listeners = new Set<(e: readonly Entity[]) => void>();
  private deps: Set<string>;
  private readonly expr: QueryExpr;

  private readonly unsubscribeWorldStructural: () => void;
  private readonly unsubscribeWorldComponents: () => void;

  constructor(
    private readonly world: World,
    builder: QueryBuilder<T>,
  ) {
    this.expr = builder.build();
    this.deps = collectQueryComponents(this.expr);
    this.recompute();

    this.unsubscribeWorldStructural = world.subscribeStructure((component) => {
      if (!component || this.deps.has(component.name)) {
        this.recompute();
      }
    });

    this.unsubscribeWorldComponents = world.subscribeComponentChange(
      (entity, component) => {
        if (this.deps.has(component.name) && this.entities.includes(entity)) {
          this.recompute();
        }
      },
    );
  }

  private recompute() {
    const next: Entity[] = [];

    for (const e of this.world.entities()) {
      if (matchQuery(this.world, e, this.expr)) {
        next.push(e);
      }
    }

    this.entities = next;
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l(this.entities);
  }

  get(): readonly Entity[] {
    return this.entities;
  }

  getComponents(entity: Entity): ComponentsOf<T> {
    return Array.from(this.deps.values()).reduce((acc, compName) => {
      const value = this.world.getComponentByName(entity, compName);
      // not that good
      acc[compName as keyof ComponentsOf<T>] = value as any;
      return acc;
    }, {} as ComponentsOf<T>);
  }

  subscribe(listener: (e: readonly Entity[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.entities);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.unsubscribeWorldStructural();
    this.unsubscribeWorldComponents();
    this.listeners.clear();
  }
}
