import { type Source } from "../../model";
import { type SequenceInstance } from "../SequenceInstance";
import { HttpSourceInstance } from "./HttpSourceInstance";

export type * from "./HttpSourceInstance";
export type * from "./SourceInstance";

/**
 * Factory function to create a SourceInstance based on the source type.
 *
 * @param owner - The owning SequenceInstance.
 * @param source - The source model.
 * @returns An instance of SourceInstance corresponding to the source type.
 * @throws Error if the source type is unsupported.
 */
export function createSourceInstance(owner: SequenceInstance, source: Source) {
  switch (source.type) {
    case "http": {
      return new HttpSourceInstance(owner, source.id);
    }
    default:
      throw new Error(`Unsupported source type: ${(source as any).type}`);
  }
}
