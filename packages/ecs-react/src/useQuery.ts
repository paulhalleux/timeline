import React from "react";
import { QueryInstance } from "@ptl/ecs";

/**
 * React hook to subscribe to a QueryInstance and get its current entities.
 *
 * @param query - The QueryInstance to subscribe to.
 * @returns The current array of entities matching the query.
 */
export function useQuery(query: QueryInstance) {
  return React.useSyncExternalStore(
    (cb) => query.subscribe(cb),
    () => query.get(),
  );
}
