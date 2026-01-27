import { Component } from "../component";
import { QueryExpr } from "./query-utils";

/**
 * Appends required components to the existing query components.
 *
 * @param T - The existing query components.
 * @param U - The components to append as required.
 * @returns The new query components with the required components appended.
 */
export type AppendRequiredComponents<
  T extends QueryComponents,
  U extends Component<any, any>[],
> = [...T, { type: "required"; components: U }];

/**
 * Appends optional components to the existing query components.
 *
 * @param T - The existing query components.
 * @param U - The components to append as optional.
 * @returns The new query components with the optional components appended.
 */
export type AppendOptionalComponents<
  T extends QueryComponents,
  U extends Component<any, any>[],
> = [...T, { type: "optional"; components: U }];

/**
 * Represents a component group in a query, specifying whether the components are required or optional.
 */
export type QueryComponent = {
  type: "required" | "optional";
  components: Component<any, any>[];
};

/**
 * Represents a collection of query components.
 */
export type QueryComponents = readonly QueryComponent[];

/**
 * A builder class for constructing complex query expressions.
 * @param T - The type representing the components involved in the query.
 */
export class QueryBuilder<T extends QueryComponents = []> {
  constructor(private expr: QueryExpr) {}

  and<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendRequiredComponents<T, C>> {
    const terms: QueryExpr[] = components.map((component) => ({
      type: "has",
      component,
    }));
    return new QueryBuilder<AppendRequiredComponents<T, C>>({
      type: "and",
      terms: [this.expr, ...terms],
    });
  }

  or<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendOptionalComponents<T, C>> {
    const terms: QueryExpr[] = components.map((component) => ({
      type: "has",
      component,
    }));
    return new QueryBuilder<AppendOptionalComponents<T, C>>({
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
