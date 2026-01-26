import React from "react";
import { type QueryComponents, QueryInstance } from "@ptl/ecs";

/**
 * React hook to subscribe to a QueryInstance and get its current entities.
 *
 * @param query - The QueryInstance to subscribe to.
 * @returns The current array of entities matching the query.
 */
export function useQuery<T extends QueryComponents>(query: QueryInstance<T>) {
  return React.useSyncExternalStore(
    (cb) => query.subscribe(cb),
    () => query.get(),
  );
}
