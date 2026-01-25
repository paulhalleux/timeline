import { TimelineModule } from "../timeline-module";
import { TimelineApi } from "../timeline";
import { Entity } from "@ptl/ecs";
import { createPlayhead } from "../entities";
import { UnitPosition } from "../timeline-components";

export class PlayheadModule implements TimelineModule {
  static id = "PlayheadModule";

  private entity: Entity | null = null;
  private timeline: TimelineApi | null = null;

  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
    this.entity = createPlayhead(timeline, { initialPosition: 0 });
    timeline.subscribe(() => {
      this.setPosition(this.getPosition());
    });
  }

  detach(timeline: TimelineApi): void {
    this.timeline = null;
    if (this.entity) {
      const world = timeline.getWorld();
      world.destroyEntity(this.entity);
      this.entity = null;
    }
  }

  getEntity(): Entity | null {
    return this.entity;
  }

  setPosition(position: number): void {
    if (!this.timeline || !this.entity) return;
    const world = this.timeline.getWorld();
    world.updateComponent(this.entity, UnitPosition, (value) => {
      value.unit = position;
    });
  }

  getPosition(): number {
    if (!this.timeline || !this.entity) return 0;
    const world = this.timeline.getWorld();
    const unitPosition = world.getComponent(this.entity, UnitPosition);
    return unitPosition ? unitPosition.unit : 0;
  }

  moveForward(delta: number): void {
    if (!this.timeline || !this.entity) return;
    this.setPosition(this.getPosition() + delta);
  }

  moveBackward(delta: number): void {
    if (!this.timeline || !this.entity) return;
    this.setPosition(this.getPosition() - delta);
  }
}
