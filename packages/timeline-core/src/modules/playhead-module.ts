import { Store } from "@ptl/store";
import { TimelineApi } from "../timeline";

export type PlayheadState = {
  position: number;
  leftPx: number;
  playing: boolean;
};

export type PlayheadOptions = {
  initialPosition?: number;
};

export class PlayheadModule {
  private readonly store;

  private unsubscribers: Array<() => void> = [];
  private timeline?: TimelineApi;
  private rafId: number | null = null;

  constructor(options: PlayheadOptions = {}) {
    this.store = new Store<PlayheadState>({
      position: options.initialPosition ?? 0,
      leftPx: 0,
      playing: false,
    });
  }

  attach(timeline: TimelineApi): void {
    this.timeline = timeline;

    this.unsubscribers.push(
      this.timeline.subscribe(() => this.recompute()),
      this.timeline.getViewport().subscribe(() => this.recompute()),
    );

    this.recompute();
  }

  detach(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.timeline = undefined;
  }

  subscribe(listener: (state: PlayheadState) => void): () => void {
    return this.store.subscribe(listener);
  }

  getState(): PlayheadState {
    return this.store.getState();
  }

  setPosition(position: number): void {
    this.store.setState((s) => ({
      ...s,
      position,
    }));
    this.recompute();
  }

  moveForward(delta: number): void {
    const currentPosition = this.store.getState().position;
    this.setPosition(currentPosition + delta);
  }

  moveBackward(delta: number): void {
    const currentPosition = this.store.getState().position;
    this.setPosition(currentPosition - delta);
  }

  play(delta: number): void {
    if (this.rafId !== null) return; // Already playing

    const step = () => {
      this.moveForward(delta);
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);

    this.store.setState((s) => ({
      ...s,
      playing: true,
    }));
  }

  pause(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.store.setState((s) => ({
      ...s,
      playing: false,
    }));
  }

  private recompute(): void {
    if (!this.timeline) return;

    const position = this.store.getState().position;
    const leftPx =
      this.timeline.projectToChunk(position) - this.timeline.getTranslatePx();

    this.store.setState((s) => ({
      ...s,
      leftPx,
    }));
  }
}
