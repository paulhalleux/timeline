import { type Clip } from "../../model";
import { type SequenceInstance } from "../SequenceInstance";

/**
 * Abstract class representing a clip instance.
 *
 * @template T - The type of the clip model.
 */
export abstract class ClipInstance<T extends Clip> {
  constructor(
    protected readonly owner: SequenceInstance,
    protected readonly id: string,
  ) {}

  /**
   * Get the owning sequence instance.
   */
  getOwner(): SequenceInstance {
    return this.owner;
  }

  /**
   * Get the clip model.
   */
  getModel(): T {
    const store = this.owner.getStore();
    const value = store.select((state) => state.clips[this.id]);

    if (!value) {
      this.owner.invalidateClipInstance(this.id);
      throw new Error(
        `Clip with ID ${this.id} not found in sequence. Instance has been invalidated.`,
      );
    }

    return value as T;
  }

  /**
   * Get the ID of the clip instance.
   */
  getId(): string {
    return this.id;
  }
}
