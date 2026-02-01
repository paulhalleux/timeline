import { type HttpSource } from "../../model";
import { SourceInstance } from "./SourceInstance";

/**
 * Class representing an HTTP source instance.
 * @extends SourceInstance<HttpSource>
 */
export class HttpSourceInstance extends SourceInstance<HttpSource> {
  async read(offset: number, length: number): Promise<ArrayBuffer> {
    const url = this.buildUrl();
    const headers = this.getModel().headers || {};

    // Set the Range header to request a specific byte range
    headers["Range"] = `bytes=${offset}-${offset + length - 1}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}`,
      );
    }

    return await response.arrayBuffer();
  }

  async readAll(): Promise<ArrayBuffer> {
    const url = this.buildUrl();
    const headers = this.getModel().headers || {};

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}`,
      );
    }

    return await response.arrayBuffer();
  }

  /** Helpers */

  /**
   * Build the full URL with query parameters.
   * @private
   */
  private buildUrl(): string {
    const { url, queryParams } = this.getModel();

    if (!queryParams || Object.keys(queryParams).length === 0) {
      return url;
    }

    const u = new URL(url);
    for (const [key, value] of Object.entries(queryParams)) {
      u.searchParams.set(key, String(value));
    }

    return u.toString();
  }
}
