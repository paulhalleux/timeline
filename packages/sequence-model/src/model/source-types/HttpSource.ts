import { type BaseSource, type SourceType } from "../core";

/**
 * Defines the HTTP data source type.
 */
export type HttpSource = BaseSource<
  SourceType.Http,
  {
    /** The URL of the HTTP source */
    url: string;
    /** Optional headers to include in the HTTP request */
    headers?: Record<string, string>;
    /** Optional query parameters to include in the HTTP request */
    queryParams?: Record<string, string>;
  }
>;
