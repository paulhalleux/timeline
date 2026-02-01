import { type SequenceInstance } from "./SequenceInstance";

/**
 * Class representing a track instance.
 */
export class TrackInstance {
  constructor(
    private readonly owner: SequenceInstance,
    private readonly id: string,
  ) {}

  /** Get the owning sequence instance. */
  getOwner() {
    return this.owner;
  }

  /** Get the track model. */
  getModel() {
    const store = this.owner.getStore();
    const value = store.select((state) => state.tracks[this.id]);

    if (!value) {
      this.owner.invalidateTrackInstance(this.id);
      throw new Error(
        `Track with ID ${this.id} not found in sequence. Instance has been invalidated.`,
      );
    }

    return value;
  }

  /** Get the ID of the track instance. */
  getId(): string {
    return this.id;
  }
}
