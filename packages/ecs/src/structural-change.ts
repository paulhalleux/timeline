import { Entity } from "./entity";
import { Component } from "./component";
import { isEqual } from "es-toolkit";

/**
 * Types of structural changes that can occur in the ECS.
 * - "add": A component is added to an entity.
 * - "remove": A component is removed from an entity.
 * - "update": A component on an entity is updated.
 * - "create": An entity is created.
 * - "destroy": An entity is destroyed.
 */
export type StructuralChangeType =
  | "add"
  | "remove"
  | "update"
  | "create"
  | "destroy";

/**
 * Represents a structural change event in the ECS.
 */
export type StructuralChange = {
  /**
   * The type of structural change.
   */
  type: StructuralChangeType;

  /**
   * The entity affected by the structural change.
   */
  entity: Entity;

  /**
   * The component involved in the structural change, or null if the change
   * pertains to entity creation or destruction.
   */
  component: Component<string, any> | null;

  /**
   * The value associated with the structural change, if applicable.
   */
  value?: any;
};

/**
 * A listener function that handles structural change events.
 */
export type StructuralChangeListener = (change: StructuralChange) => void;

/**
 * Represents a subscription to structural change events.
 */
export type StructuralChangeSubscription = {
  listener: StructuralChangeListener;
  lastValue?: any;
};

/**
 * A class that manages structural change listeners and emits structural change events.
 */
export class StructuralChangeEmitter {
  private subscriptions: StructuralChangeSubscription[] = [];

  /**
   * Subscribes a listener to structural change events.
   * @param listener - The listener function to subscribe.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: StructuralChangeListener): () => void {
    const subscription: StructuralChangeSubscription = { listener };
    this.subscriptions.push(subscription);
    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (index !== -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Emits a structural change event to all subscribed listeners.
   * @param change - The structural change event to emit.
   */
  emit(change: StructuralChange): void {
    for (const subscription of this.subscriptions) {
      if (isEqual(subscription.lastValue, change.value)) {
        continue;
      }
      subscription.lastValue = change.value;
      subscription.listener(change);
    }
  }
}
