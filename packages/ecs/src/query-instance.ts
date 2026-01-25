import { Entity, World } from "./world";
import { isEqual } from "es-toolkit";
import { collectQueryComponents, matchQuery, QueryExpr } from "./query";

export class QueryInstance {
  private entities: Entity[] = [];
  private listeners = new Set<(e: readonly Entity[]) => void>();
  private deps: Set<string>;

  private readonly unsubscribeWorld: () => void;

  constructor(
    private readonly world: World,
    private readonly expr: QueryExpr,
  ) {
    this.deps = collectQueryComponents(expr);
    this.recompute();

    this.unsubscribeWorld = world.subscribeStructure((component) => {
      if (!component || this.deps.has(component.name)) {
        this.recompute();
      }
    });
  }

  private recompute() {
    const next: Entity[] = [];

    for (const e of this.world.entities()) {
      if (matchQuery(this.world, e, this.expr)) {
        next.push(e);
      }
    }

    if (!isEqual(this.entities, next)) {
      this.entities = next;
      this.emit();
    }
  }

  private emit() {
    for (const l of this.listeners) l(this.entities);
  }

  get(): readonly Entity[] {
    return this.entities;
  }

  subscribe(listener: (e: readonly Entity[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.entities);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.unsubscribeWorld();
    this.listeners.clear();
  }
}
