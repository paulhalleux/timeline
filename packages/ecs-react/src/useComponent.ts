import { type Component, type Entity, type World } from "@ptl/ecs";
import React from "react";

/**
 * React hook to subscribe to a component's state on a specific entity within a world.
 *
 * @param world - The ECS world instance.
 * @param entity - The entity whose component state to subscribe to.
 * @param component - The component to subscribe to.
 * @returns The current state of the component for the specified entity, or undefined if not present.
 */
export function useComponent<T>(
  world: World,
  entity: Entity,
  component: Component<string, T>,
): T | undefined {
  return React.useSyncExternalStore(
    (cb) => world.subscribeComponent(entity, component, cb),
    () => world.getComponent(entity, component),
  );
}
