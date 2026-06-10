export function parseVttTimestamp(text: string): number {
  const trimmed = text.trim();
  const shortMatch = trimmed.match(/^(\d{1,2}):(\d{2})\.(\d{3})$/);

  if (shortMatch) {
    const minutes = parseInt(shortMatch[1], 10);
    const seconds = parseInt(shortMatch[2], 10);
    const milliseconds = parseInt(shortMatch[3], 10);
    return minutes * 60000 + seconds * 1000 + milliseconds;
  }

  const longMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (longMatch) {
    const hours = parseInt(longMatch[1], 10);
    const minutes = parseInt(longMatch[2], 10);
    const seconds = parseInt(longMatch[3], 10);
    const milliseconds = parseInt(longMatch[4], 10);
    return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
  }

  throw new Error(`Invalid VTT timestamp: ${text}`);
}

export function formatVttTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.round(ms % 1000);

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    String(milliseconds).padStart(3, "0")
  );
}
