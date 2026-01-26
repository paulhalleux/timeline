import { ReactiveSystem } from "./reactive-system";
import { World } from "../world";

export type SystemBase<Kind extends string, Api> = {
  kind: Kind;
  attach(world: World): void;
  detach(): void;
} & Api;

export type System = ReactiveSystem;
export { type ReactiveSystem, createReactiveSystem } from "./reactive-system";
