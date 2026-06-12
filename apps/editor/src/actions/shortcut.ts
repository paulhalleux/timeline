import { normalizeShortcut } from "@ptl/actions";

export function eventToShortcut(event: KeyboardEvent): string | undefined {
  const key =
    event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase().replace(/\s/g, "");

  if (["alt", "control", "meta", "shift"].includes(key)) return undefined;

  const parts: string[] = [];

  if (event.altKey) parts.push("Alt");
  if (event.ctrlKey || event.metaKey) parts.push("Mod");
  if (event.shiftKey) parts.push("Shift");

  parts.push(key);

  return normalizeShortcut(parts.join("+"));
}

export function formatShortcut(shortcut: string): string {
  return shortcut
    .split("+")
    .map((part) => {
      const normalizedPart = part.trim().toLowerCase();

      if (normalizedPart === "mod")
        return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
      if (normalizedPart === "shift") return "⇧";
      if (normalizedPart === "alt") return "⌥";

      return part.toUpperCase();
    })
    .join("");
}
