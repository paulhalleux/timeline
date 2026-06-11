import { type Module } from "@ptl/modular-core";

import { type TimelineApi } from "./timeline";

/**
 * Interface representing a module that can be attached to the timeline.
 */
export type TimelineModule<Api extends object = object> = Module<Api, TimelineApi>;
