export interface SrtDocument {
  type: "srt";
  cues: SrtCue[];
  metadata?: Record<string, unknown>;
}

export interface SrtCue {
  id: string;
  index: number;
  startMs: number;
  endMs: number;
  lines: string[];
}
