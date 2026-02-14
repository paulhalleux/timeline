import { Store } from "@ptl/modular-core";

import type { EditorModule } from "../editor-module";
import type { PlaybackState } from "../types";
import { clamp } from "../utils";

// ============================================================================
// Playback Module State
// ============================================================================

export interface PlaybackModuleState extends PlaybackState {
  /** Video duration in milliseconds */
  duration: number;
}

const createInitialState = (): PlaybackModuleState => ({
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  duration: 0,
});

// ============================================================================
// Playback Controller Interface
// ============================================================================

/**
 * Interface for controlling playback.
 * This abstracts the actual media element from the module.
 */
export interface PlaybackController {
  play(): void;
  pause(): void;
  seek(timeMs: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setPlaybackRate(rate: number): void;
}

// ============================================================================
// Playback Module API
// ============================================================================

export interface PlaybackModuleApi {
  getStore(): Store<PlaybackModuleState>;
  getState(): PlaybackModuleState;
  connect(controller: PlaybackController): void;
  disconnect(): void;
  isConnected(): boolean;
  update(updates: Partial<PlaybackModuleState>): void;
  setCurrentTime(timeMs: number): void;
  setDuration(durationMs: number): void;
  setIsPlaying(isPlaying: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  play(): void;
  pause(): void;
  togglePlayPause(): void;
  seek(timeMs: number): void;
  seekRelative(deltaMs: number): void;
  seekForward(amountMs?: number): void;
  seekBackward(amountMs?: number): void;
  seekToStart(): void;
  seekToEnd(): void;
  getVolume(): number;
  setVolume(volume: number): void;
  volumeUp(step?: number): void;
  volumeDown(step?: number): void;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
  toggleMute(): void;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  cyclePlaybackRate(): void;
  reset(): void;
  destroy(): void;
}

// ============================================================================
// Playback Module
// ============================================================================

/**
 * Module for managing playback state.
 * Can be connected to a video element or any other media source.
 */
export class PlaybackModule implements EditorModule<PlaybackModuleApi> {
  static id = "PlaybackModule";

  /**
   * Available playback rates.
   */
  static readonly RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  private readonly store: Store<PlaybackModuleState>;
  private controller: PlaybackController | null = null;

  constructor() {
    this.store = new Store<PlaybackModuleState>(createInitialState());
  }

  // Static Methods

  static for(editor: {
    getModule: (m: typeof PlaybackModule) => PlaybackModule;
  }): PlaybackModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(): void {}
  detach(): void {}

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<PlaybackModuleState> {
    return this.store;
  }

  getState(): PlaybackModuleState {
    return this.store.get();
  }

  // ---------------------------------------------------------------------------
  // Controller Connection
  // ---------------------------------------------------------------------------

  /**
   * Connects a playback controller (e.g., video element wrapper).
   */
  connect(controller: PlaybackController): void {
    this.controller = controller;
  }

  /**
   * Disconnects the playback controller.
   */
  disconnect(): void {
    this.controller = null;
  }

  /**
   * Checks if a controller is connected.
   */
  isConnected(): boolean {
    return this.controller !== null;
  }

  // ---------------------------------------------------------------------------
  // State Updates (called from external sources like video events)
  // ---------------------------------------------------------------------------

  /**
   * Updates the playback state. Called when video events fire.
   */
  update(updates: Partial<PlaybackModuleState>): void {
    const state = this.getState();
    this.store.set({ ...state, ...updates });
  }

  /**
   * Sets the current time (from video timeupdate event).
   */
  setCurrentTime(timeMs: number): void {
    this.update({ currentTime: timeMs });
  }

  /**
   * Sets the duration (from video loadedmetadata event).
   */
  setDuration(durationMs: number): void {
    this.update({ duration: durationMs });
  }

  /**
   * Sets the playing state.
   */
  setIsPlaying(isPlaying: boolean): void {
    this.update({ isPlaying });
  }

  // ---------------------------------------------------------------------------
  // Playback Controls
  // ---------------------------------------------------------------------------

  /**
   * Gets the current time in milliseconds.
   */
  getCurrentTime(): number {
    return this.getState().currentTime;
  }

  /**
   * Gets the duration in milliseconds.
   */
  getDuration(): number {
    return this.getState().duration;
  }

  /**
   * Plays the media.
   */
  play(): void {
    this.controller?.play();
  }

  /**
   * Pauses the media.
   */
  pause(): void {
    this.controller?.pause();
  }

  /**
   * Toggles play/pause.
   */
  togglePlayPause(): void {
    if (this.getState().isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seeks to a specific time in milliseconds.
   */
  seek(timeMs: number): void {
    const clampedTime = clamp(timeMs, 0, Infinity);
    this.controller?.seek(clampedTime);
    this.update({ currentTime: clampedTime });
  }

  /**
   * Seeks relative to current time.
   */
  seekRelative(deltaMs: number): void {
    const { currentTime } = this.getState();
    this.seek(currentTime + deltaMs);
  }

  /**
   * Seeks forward by a specified amount.
   */
  seekForward(amountMs = 5000): void {
    this.seekRelative(amountMs);
  }

  /**
   * Seeks backward by a specified amount.
   */
  seekBackward(amountMs = 5000): void {
    this.seekRelative(-amountMs);
  }

  /**
   * Seeks to the start.
   */
  seekToStart(): void {
    this.seek(0);
  }

  /**
   * Seeks to the end.
   */
  seekToEnd(): void {
    this.seek(this.getState().duration);
  }

  // ---------------------------------------------------------------------------
  // Volume Controls
  // ---------------------------------------------------------------------------

  /**
   * Gets the current volume.
   */
  getVolume(): number {
    return this.getState().volume;
  }

  /**
   * Sets the volume (0-1).
   */
  setVolume(volume: number): void {
    const clampedVolume = clamp(volume, 0, 1);
    this.controller?.setVolume(clampedVolume);
    this.update({ volume: clampedVolume });
  }

  /**
   * Increases volume by a step.
   */
  volumeUp(step = 0.1): void {
    this.setVolume(this.getState().volume + step);
  }

  /**
   * Decreases volume by a step.
   */
  volumeDown(step = 0.1): void {
    this.setVolume(this.getState().volume - step);
  }

  /**
   * Checks if muted.
   */
  isMuted(): boolean {
    return this.getState().isMuted;
  }

  /**
   * Sets muted state.
   */
  setMuted(muted: boolean): void {
    this.controller?.setMuted(muted);
    this.update({ isMuted: muted });
  }

  /**
   * Toggles mute.
   */
  toggleMute(): void {
    this.setMuted(!this.getState().isMuted);
  }

  // ---------------------------------------------------------------------------
  // Playback Rate
  // ---------------------------------------------------------------------------

  /**
   * Gets the playback rate.
   */
  getPlaybackRate(): number {
    return this.getState().playbackRate;
  }

  /**
   * Sets the playback rate (0.25 - 2.0).
   */
  setPlaybackRate(rate: number): void {
    const clampedRate = clamp(rate, 0.25, 2);
    this.controller?.setPlaybackRate(clampedRate);
    this.update({ playbackRate: clampedRate });
  }

  /**
   * Cycles to next playback rate.
   */
  cyclePlaybackRate(): void {
    const current = this.getState().playbackRate;
    const currentIndex = PlaybackModule.RATES.indexOf(current);
    const nextIndex = (currentIndex + 1) % PlaybackModule.RATES.length;
    this.setPlaybackRate(PlaybackModule.RATES[nextIndex]);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Resets the module state.
   */
  reset(): void {
    this.store.set(createInitialState());
  }

  /**
   * Destroys the module.
   */
  destroy(): void {
    this.disconnect();
    this.reset();
  }
}
