import { ReactiveSystem } from "./reactive-system";
import { World } from "./world";

export type SystemBase<Kind extends string, Api> = {
  kind: Kind;
  attach(world: World): void;
  detach(): void;
} & Api;

export type System = ReactiveSystem<any>;

export const isReactiveSystem = (
  system: System,
): system is ReactiveSystem<any> => {
  return system.kind === "reactive";
};
