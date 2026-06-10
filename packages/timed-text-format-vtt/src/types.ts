export interface VttDocument {
  type: "vtt";
  header?: string;
  regions: VttRegion[];
  cues: VttCue[];
  comments: VttComment[];
  styles: VttStyleBlock[];
  metadata?: Record<string, unknown>;
}

export interface VttCue {
  id: string;
  identifier?: string;
  startMs: number;
  endMs: number;
  payload: string;
  settings?: VttCueSettings;
}

export interface VttCueSettings {
  line?: string;
  position?: string;
  size?: string;
  align?: "start" | "center" | "end" | "left" | "right";
  vertical?: "rl" | "lr";
  region?: string;
}

export interface VttRegion {
  id: string;
  settings: Record<string, string>;
}

export interface VttComment {
  id: string;
  text: string;
}

export interface VttStyleBlock {
  id: string;
  css: string;
}
