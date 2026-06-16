import type { LocalizedText } from "@ptl/platform-core";

export function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function localizedTextToString(value: LocalizedText): string {
  return typeof value === "string" ? value : value.defaultMessage;
}
