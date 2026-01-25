import { type Entity, World } from "./world";
import { type Component } from "./component";

type AppendRequired<T extends readonly any[], U extends readonly any[]> = [
  ...T,
  { type: "required"; components: U },
];

type AppendOptional<T extends readonly any[], U extends readonly any[]> = [
  ...T,
  { type: "optional"; components: U },
];

export type _QueryList = readonly {
  type: "required" | "optional";
  components: Component<any, any>[];
}[];

export class QueryBuilder<T extends _QueryList = []> {
  constructor(private expr: QueryExpr) {}

  and<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendRequired<T, C>> {
    const terms: QueryExpr[] = components.map((component) => ({
      type: "has",
      component,
    }));
    return new QueryBuilder<AppendRequired<T, C>>({
      type: "and",
      terms: [this.expr, ...terms],
    });
  }

  or<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendOptional<T, C>> {
    const terms: QueryExpr[] = components.map((component) => ({
      type: "has",
      component,
    }));
    return new QueryBuilder<AppendOptional<T, C>>({
      type: "or",
      terms: [this.expr, ...terms],
    });
  }

  not(): QueryBuilder<T> {
    return new QueryBuilder<T>({
      type: "not",
      term: this.expr,
    });
  }

  build(): QueryExpr {
    return this.expr;
  }
}

export class Query {
  static and<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendRequired<[], C>> {
    return new QueryBuilder<AppendRequired<[], C>>({
      type: "and",
      terms: components.map((component) => ({
        type: "has",
        component,
      })),
    });
  }

  static or<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendOptional<[], C>> {
    return new QueryBuilder<AppendOptional<[], C>>({
      type: "or",
      terms: components.map((component) => ({
        type: "has",
        component,
      })),
    });
  }

  static has<C extends Component<any, any>>(
    component: C,
  ): QueryBuilder<AppendRequired<[], [C]>> {
    return new QueryBuilder<AppendRequired<[], [C]>>({
      type: "has",
      component,
    });
  }

  static not(): QueryBuilder {
    return new QueryBuilder<[]>({
      type: "not",
      term: { type: "and", terms: [] },
    });
  }
}

export type QueryExpr =
  | { type: "has"; component: Component<any, any> }
  | { type: "and"; terms: QueryExpr[] }
  | { type: "or"; terms: QueryExpr[] }
  | { type: "not"; term: QueryExpr };

/**
 * Determines if an entity in the world matches a given query expression.
 *
 * @param world - The world containing the entity and its components.
 * @param entity - The entity to check against the query expression.
 * @param expr - The query expression to evaluate.
 * @returns True if the entity matches the query expression, false otherwise.
 */
export function matchQuery(
  world: World,
  entity: Entity,
  expr: QueryExpr,
): boolean {
  switch (expr.type) {
    case "has":
      return world.hasComponent(entity, expr.component);
    case "not":
      return !matchQuery(world, entity, expr.term);
    case "and":
      return expr.terms.every((t) => matchQuery(world, entity, t));
    case "or":
      return expr.terms.some((t) => matchQuery(world, entity, t));
  }
}

/**
 * Serializes a query expression into a string representation.
 *
 * @param expr - The query expression to serialize.
 * @returns A string representation of the query expression.
 */
export function serializeQuery(expr: QueryExpr): string {
  switch (expr.type) {
    case "has":
      return `has(${expr.component.name})`;
    case "not":
      return `not(${serializeQuery(expr.term)})`;
    case "and":
      return `and(${expr.terms.map(serializeQuery).sort().join(",")})`;
    case "or":
      return `or(${expr.terms.map(serializeQuery).sort().join(",")})`;
  }
}

/**
 * Collects all unique components referenced in a query expression.
 *
 * @param expr - The query expression to analyze.
 * @param out - An optional Set to accumulate the components.
 * @returns A Set of unique components found in the query expression.
 */
export function collectQueryComponents(
  expr: QueryExpr,
  out = new Set<string>(),
): Set<string> {
  switch (expr.type) {
    case "has":
      out.add(expr.component.name);
      break;
    case "not":
      collectQueryComponents(expr.term, out);
      break;
    case "and":
    case "or":
      expr.terms.forEach((t) => collectQueryComponents(t, out));
      break;
  }
  return out;
}
