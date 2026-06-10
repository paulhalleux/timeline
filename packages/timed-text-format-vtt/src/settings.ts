import type { VttCueSettings } from "./types";

export function parseVttSettings(text: string): VttCueSettings {
  const settings: VttCueSettings = {};
  const pairs = text.split(/\s+/);

  for (const pair of pairs) {
    const [key, value] = pair.split(":");
    if (!key || !value) continue;

    switch (key) {
      case "vertical":
        if (value === "rl" || value === "lr") settings.vertical = value;
        break;
      case "line":
        settings.line = value;
        break;
      case "position":
        settings.position = value;
        break;
      case "size":
        settings.size = value;
        break;
      case "align":
        if (["start", "center", "end", "left", "right"].includes(value)) {
          settings.align = value as VttCueSettings["align"];
        }
        break;
      case "region":
        settings.region = value;
        break;
    }
  }

  return settings;
}

export function stringifyVttSettings(settings: VttCueSettings): string {
  const parts: string[] = [];

  if (settings.vertical) parts.push(`vertical:${settings.vertical}`);
  if (settings.line) parts.push(`line:${settings.line}`);
  if (settings.position) parts.push(`position:${settings.position}`);
  if (settings.size) parts.push(`size:${settings.size}`);
  if (settings.align) parts.push(`align:${settings.align}`);
  if (settings.region) parts.push(`region:${settings.region}`);

  return parts.join(" ");
}
