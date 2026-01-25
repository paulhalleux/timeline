import { TimelineApi } from "../timeline";
import { createPlayhead, CreatePlayheadOptions } from "../entities";
import { PlayheadEntity } from "../entities/playhead";
import { TimelineModule } from "../timeline-module";

export class PlayheadModule implements TimelineModule {
  static id = "PlayheadModule";

  private playhead: PlayheadEntity | null = null;
  private rafId: number | null = null;

  private unsubscribers: Array<() => void> = [];
  private timeline?: TimelineApi;

  constructor(private readonly options: CreatePlayheadOptions = {}) {}

  attach(timeline: TimelineApi): void {
    this.timeline = timeline;
    this.playhead = createPlayhead(timeline, this.options);

    this.unsubscribers.push(
      this.timeline.subscribe(() => this.playhead?.recompute()),
      this.timeline.getViewport().subscribe(() => this.playhead?.recompute()),
    );

    this.playhead.recompute();
  }

  detach(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.timeline = undefined;
  }

  getPlayhead(): PlayheadEntity | null {
    return this.playhead;
  }

  setPosition(position: number): void {
    if (!this.playhead) return;
    this.playhead.setPosition(position);
  }

  moveForward(delta: number): void {
    if (!this.playhead) return;
    const currentPosition = this.playhead.getPosition();
    this.setPosition(currentPosition + delta);
  }

  moveBackward(delta: number): void {
    if (!this.playhead) return;
    const currentPosition = this.playhead.getPosition();
    this.setPosition(currentPosition - delta);
  }

  play(delta: number): void {
    if (this.rafId !== null || !this.playhead) return; // Already playing

    const step = () => {
      this.moveForward(delta);
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
    this.playhead.setPlaying(true);
  }

  pause(): void {
    if (!this.playhead) return;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.playhead.setPlaying(false);
  }
}
