export type SubtitlePlaybackStatus = "paused" | "playing";

export interface SubtitlePlaybackState {
  status: SubtitlePlaybackStatus;
  currentTimeMs: number;
  durationMs?: number;
  playbackRate: number;
}

export type SubtitlePlaybackEvent =
  | ({ type: "playback.changed" } & SubtitlePlaybackState)
  | { type: "playback.played"; currentTimeMs: number }
  | { type: "playback.paused"; currentTimeMs: number }
  | { type: "playback.seeked"; currentTimeMs: number }
  | { type: "playback.rateChanged"; playbackRate: number };
