import { type Component } from "../component";
import {
  AppendOptionalComponents,
  AppendRequiredComponents,
  QueryBuilder,
} from "./query-builder";

/**
 * A static class providing methods to create query builders for various query expressions.
 */
export class Query {
  static and<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendRequiredComponents<[], C>> {
    return new QueryBuilder<AppendRequiredComponents<[], C>>({
      type: "and",
      terms: components.map((component) => ({
        type: "has",
        component,
      })),
    });
  }

  static or<C extends Component<any, any>[]>(
    ...components: C
  ): QueryBuilder<AppendOptionalComponents<[], C>> {
    return new QueryBuilder<AppendOptionalComponents<[], C>>({
      type: "or",
      terms: components.map((component) => ({
        type: "has",
        component,
      })),
    });
  }

  static has<C extends Component<any, any>>(
    component: C,
  ): QueryBuilder<AppendRequiredComponents<[], [C]>> {
    return new QueryBuilder<AppendRequiredComponents<[], [C]>>({
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
