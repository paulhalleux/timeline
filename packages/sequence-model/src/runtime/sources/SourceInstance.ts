import { type Source } from "../../model";
import { type SequenceInstance } from "../SequenceInstance";

/**
 * Abstract class representing a source instance.
 *
 * @template T - The type of the source model.
 */
export abstract class SourceInstance<T extends Source> {
  constructor(
    protected readonly owner: SequenceInstance,
    protected readonly id: string,
  ) {}

  /**
   * Read a portion of data from the source instance.
   *
   * @param offset - The offset to start reading from.
   * @param length - The number of bytes to read.
   * @returns A promise that resolves to an ArrayBuffer containing the read data.
   */
  abstract read(offset: number, length: number): Promise<ArrayBuffer>;

  /**
   * Read all data from the source instance.
   *
   * @returns A promise that resolves to an ArrayBuffer containing all the data.
   */
  abstract readAll(): Promise<ArrayBuffer>;

  /**
   * Get the owning sequence instance.
   */
  getOwner(): SequenceInstance {
    return this.owner;
  }

  /**
   * Get the source model.
   */
  getModel(): T {
    const store = this.owner.getStore();
    const value = store.select((state) => state.sources[this.id]);

    if (!value) {
      this.owner.invalidateSourceInstance(this.id);
      throw new Error(
        `Source with ID ${this.id} not found in sequence. Instance has been invalidated.`,
      );
    }

    return value as T;
  }

  /**
   * Get the ID of the source instance.
   */
  getId(): string {
    return this.id;
  }
}
