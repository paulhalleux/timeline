import { TimelineApi } from "./timeline";

/**
 * Interface representing a module that can be attached to the timeline.
 */
export interface TimelineModule {
  /**
   * Attaches the module to the given timeline instance.
   *
   * @param timeline The timeline instance to attach the module to.
   */
  attach(timeline: TimelineApi): void;

  /**
   * Detaches the module from the timeline.
   */
  detach?(): void;
}
