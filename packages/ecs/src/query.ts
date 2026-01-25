import { type Entity, World } from "./world";
import { type Component, isComponent } from "./component";

export type QueryExpr =
  | { type: "has"; component: Component<any> }
  | { type: "and"; terms: QueryExpr[] }
  | { type: "or"; terms: QueryExpr[] }
  | { type: "not"; term: QueryExpr };

export class Query {
  static has(component: Component<any>): QueryExpr {
    return { type: "has", component };
  }

  static and(...terms: (Component<any> | QueryExpr)[]): QueryExpr {
    return {
      type: "and",
      terms: terms.map(normalizeQuery),
    };
  }

  static or(...terms: (Component<any> | QueryExpr)[]): QueryExpr {
    return {
      type: "or",
      terms: terms.map(normalizeQuery),
    };
  }

  static not(term: Component<any> | QueryExpr): QueryExpr {
    return {
      type: "not",
      term: normalizeQuery(term),
    };
  }
}

/**
 * Normalizes an input into a QueryExpr.
 *
 * @param input - The input to normalize, either a Component or a QueryExpr.
 * @returns The normalized QueryExpr.
 */
export function normalizeQuery(input: Component<any> | QueryExpr): QueryExpr {
  return isComponent(input) ? Query.has(input) : input;
}

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
