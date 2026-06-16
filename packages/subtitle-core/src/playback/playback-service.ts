import { PlatformError, TypedEventEmitter, type Disposable } from "@ptl/platform-core";
import { Store } from "@ptl/store";

import { subtitleErrorCodes } from "../errors";
import type { SubtitlePlaybackEvent, SubtitlePlaybackState } from "./events";

export interface SeekPlaybackInput {
  timeMs: number;
}

export interface SetPlaybackDurationInput {
  durationMs?: number;
}

export interface SetPlaybackRateInput {
  playbackRate: number;
}

interface SubtitlePlaybackEvents {
  event: SubtitlePlaybackEvent;
}

/**
 * Pure playback contract for subtitle workflows.
 *
 * The service owns editor-facing playback state without depending on
 * `HTMLMediaElement`, React, or a concrete waveform/video player. Apps can
 * mirror real media events into this service and register the built-in
 * playback command handlers against it.
 *
 * @example
 * ```ts
 * const playback = new SubtitlePlaybackService({ durationMs: 60_000 });
 * playback.seek({ timeMs: 12_500 });
 * playback.play();
 * ```
 */
export class SubtitlePlaybackService {
  private readonly events = new TypedEventEmitter<SubtitlePlaybackEvents>();
  private readonly store: Store<SubtitlePlaybackState>;

  constructor(initialState: Partial<SubtitlePlaybackState> = {}) {
    this.store = new Store(normalizePlaybackState({
      status: initialState.status ?? "paused",
      currentTimeMs: initialState.currentTimeMs ?? 0,
      durationMs: initialState.durationMs,
      playbackRate: initialState.playbackRate ?? 1,
    }));
  }

  getStore(): Store<SubtitlePlaybackState> {
    return this.store;
  }

  getState(): SubtitlePlaybackState {
    return this.store.get();
  }

  canSeek(timeMs: number): boolean {
    return Number.isFinite(timeMs) && timeMs >= 0;
  }

  play(): SubtitlePlaybackState {
    return this.updateState({ status: "playing" }, { type: "playback.played" });
  }

  pause(): SubtitlePlaybackState {
    return this.updateState({ status: "paused" }, { type: "playback.paused" });
  }

  toggle(): SubtitlePlaybackState {
    return this.getState().status === "playing" ? this.pause() : this.play();
  }

  seek(input: SeekPlaybackInput): SubtitlePlaybackState {
    if (!this.canSeek(input.timeMs)) {
      throw new PlatformError({
        code: subtitleErrorCodes.playbackInvalidState,
        message: "Playback seek time must be a finite non-negative number.",
        details: input,
      });
    }

    const nextTimeMs = clampTime(input.timeMs, this.getState().durationMs);
    return this.updateState({ currentTimeMs: nextTimeMs }, { type: "playback.seeked" });
  }

  setDuration(input: SetPlaybackDurationInput): SubtitlePlaybackState {
    if (input.durationMs !== undefined && (!Number.isFinite(input.durationMs) || input.durationMs < 0)) {
      throw new PlatformError({
        code: subtitleErrorCodes.playbackInvalidState,
        message: "Playback duration must be a finite non-negative number when provided.",
        details: input,
      });
    }

    const durationMs = input.durationMs;
    return this.updateState({
      durationMs,
      currentTimeMs: clampTime(this.getState().currentTimeMs, durationMs),
    });
  }

  setRate(input: SetPlaybackRateInput): SubtitlePlaybackState {
    if (!Number.isFinite(input.playbackRate) || input.playbackRate <= 0) {
      throw new PlatformError({
        code: subtitleErrorCodes.playbackInvalidState,
        message: "Playback rate must be a finite positive number.",
        details: input,
      });
    }

    return this.updateState(
      { playbackRate: input.playbackRate },
      { type: "playback.rateChanged" },
    );
  }

  subscribe(listener: (event: SubtitlePlaybackEvent) => void): Disposable {
    return this.events.on("event", listener);
  }

  private updateState(
    patch: Partial<SubtitlePlaybackState>,
    specificEvent?: { type: SubtitlePlaybackEvent["type"] },
  ): SubtitlePlaybackState {
    const previous = this.getState();
    const next = normalizePlaybackState({ ...previous, ...patch });

    if (isSamePlaybackState(previous, next)) {
      return previous;
    }

    this.store.set(next);
    if (specificEvent) {
      this.events.emit("event", specificEventForState(specificEvent.type, next));
    }
    this.events.emit("event", { type: "playback.changed", ...next });

    return this.getState();
  }
}

function normalizePlaybackState(state: SubtitlePlaybackState): SubtitlePlaybackState {
  if (!Number.isFinite(state.currentTimeMs) || state.currentTimeMs < 0) {
    throw new PlatformError({
      code: subtitleErrorCodes.playbackInvalidState,
      message: "Playback current time must be a finite non-negative number.",
      details: state,
    });
  }

  if (state.durationMs !== undefined && (!Number.isFinite(state.durationMs) || state.durationMs < 0)) {
    throw new PlatformError({
      code: subtitleErrorCodes.playbackInvalidState,
      message: "Playback duration must be a finite non-negative number when provided.",
      details: state,
    });
  }

  if (!Number.isFinite(state.playbackRate) || state.playbackRate <= 0) {
    throw new PlatformError({
      code: subtitleErrorCodes.playbackInvalidState,
      message: "Playback rate must be a finite positive number.",
      details: state,
    });
  }

  return {
    ...state,
    currentTimeMs: clampTime(state.currentTimeMs, state.durationMs),
  };
}

function clampTime(timeMs: number, durationMs: number | undefined) {
  return durationMs === undefined ? timeMs : Math.min(timeMs, durationMs);
}

function isSamePlaybackState(previous: SubtitlePlaybackState, next: SubtitlePlaybackState) {
  return (
    previous.status === next.status &&
    previous.currentTimeMs === next.currentTimeMs &&
    previous.durationMs === next.durationMs &&
    previous.playbackRate === next.playbackRate
  );
}

function specificEventForState(
  type: SubtitlePlaybackEvent["type"],
  state: SubtitlePlaybackState,
): SubtitlePlaybackEvent {
  switch (type) {
    case "playback.played":
      return { type, currentTimeMs: state.currentTimeMs };
    case "playback.paused":
      return { type, currentTimeMs: state.currentTimeMs };
    case "playback.seeked":
      return { type, currentTimeMs: state.currentTimeMs };
    case "playback.rateChanged":
      return { type, playbackRate: state.playbackRate };
    case "playback.changed":
      return { type, ...state };
  }
}
