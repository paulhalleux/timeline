import { type HttpSource } from "../source-types";

/**
 * Defines the roles that a data source can have.
 */
export enum SourceRole {
  /** The source is used for audio content */
  Audio = "audio",
  /** The source is used for video content */
  Video = "video",
  /** The source is used for image content */
  Image = "image",
  /** The source is used for generic data */
  Data = "data",
}

/**
 * Represents a binding between a source and its role in a sequence.
 */
export type SourceBinding = {
  /** The role of the source in the context of a sequence */
  role: SourceRole;
  /** The unique identifier of the source */
  id: string;
};

/**
 * Defines the types and interfaces for different data source types.
 */
export enum SourceType {
  Http = "http",
}

/**
 * Base interface for a data source.
 * @param Type - The type of the source (e.g., File, Http).
 * @param Props - Additional properties specific to the source type.
 */
export type BaseSource<
  Type extends SourceType,
  Props = Record<string, unknown>,
> = Props & {
  /** Unique identifier for the source */
  id: string;
  /** Type of the source */
  type: Type;
  /** Optional metadata associated with the source */
  metadata?: Record<string, unknown>;
};

/**
 * Union type representing all possible data sources.
 */
export type Source = HttpSource;
