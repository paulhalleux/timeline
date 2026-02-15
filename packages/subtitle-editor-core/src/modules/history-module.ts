import { type CoreApi, Store } from "@ptl/modular-core";

import type { EditorModule } from "../editor-module";

// ============================================================================
// History Types
// ============================================================================

/**
 * Represents a single action that can be undone/redone.
 */
export interface HistoryAction {
  /** Unique identifier for this action */
  id: string;
  /** Type of action for display/debugging */
  type: string;
  /** Human-readable description */
  description: string;
  /** Timestamp when action was recorded */
  timestamp: number;
  /** Function to undo this action */
  undo: () => void;
  /** Function to redo this action */
  redo: () => void;
}

/**
 * Options for configuring the history module.
 */
export interface HistoryModuleOptions {
  /** Maximum number of actions to keep in history (default: 100) */
  maxHistorySize?: number;
}

// ============================================================================
// History Module State
// ============================================================================

export interface HistoryModuleState {
  /** Stack of actions that can be undone */
  undoStack: HistoryAction[];
  /** Stack of actions that can be redone */
  redoStack: HistoryAction[];
  /** Whether we're currently performing an undo/redo (to prevent recording) */
  isUndoingOrRedoing: boolean;
}

const createInitialState = (): HistoryModuleState => ({
  undoStack: [],
  redoStack: [],
  isUndoingOrRedoing: false,
});

// ============================================================================
// History Module API
// ============================================================================

export interface HistoryModuleApi {
  getStore(): Store<HistoryModuleState>;
  getState(): HistoryModuleState;

  /** Record a new action that can be undone */
  record(action: Omit<HistoryAction, "id" | "timestamp">): void;

  /** Undo the last action */
  undo(): boolean;

  /** Redo the last undone action */
  redo(): boolean;

  /** Check if there are actions to undo */
  canUndo(): boolean;

  /** Check if there are actions to redo */
  canRedo(): boolean;

  /** Get the number of actions that can be undone */
  getUndoCount(): number;

  /** Get the number of actions that can be redone */
  getRedoCount(): number;

  /** Get the last action that can be undone */
  getLastUndoAction(): HistoryAction | undefined;

  /** Get the last action that can be redone */
  getLastRedoAction(): HistoryAction | undefined;

  /** Clear all history */
  clear(): void;

  /** Check if currently undoing/redoing */
  isUndoingOrRedoing(): boolean;

  /**
   * Execute a function without recording it in history.
   * Useful for batch operations or internal state updates.
   */
  withoutRecording<T>(fn: () => T): T;

  /**
   * Create a batch of operations that will be recorded as a single undo action.
   * @param description Description of the batch operation
   * @param fn Function containing the operations to batch
   */
  batch(description: string, fn: () => void): void;

  destroy(): void;
}

// ============================================================================
// History Module
// ============================================================================

/**
 * Module for managing undo/redo history.
 * Provides a stack-based history system for tracking and reverting changes.
 */
export class HistoryModule implements EditorModule<HistoryModuleApi> {
  static id = "HistoryModule";

  private readonly store: Store<HistoryModuleState>;
  private readonly options: Required<HistoryModuleOptions>;
  private actionIdCounter = 0;

  // For batching
  private batchActions: Array<Omit<HistoryAction, "id" | "timestamp">> = [];
  private isBatching = false;
  private batchDescription = "";

  constructor(options: HistoryModuleOptions = {}) {
    this.store = new Store<HistoryModuleState>(createInitialState());
    this.options = {
      maxHistorySize: options.maxHistorySize ?? 100,
    };
  }

  // Static Methods

  static for<A>(editor: CoreApi<A>): HistoryModule {
    return editor.getModule(this);
  }

  // Lifecycle Methods

  attach(): void {}
  detach(): void {
    this.clear();
  }

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  getStore(): Store<HistoryModuleState> {
    return this.store;
  }

  getState(): HistoryModuleState {
    return this.store.get();
  }

  // ---------------------------------------------------------------------------
  // Recording Actions
  // ---------------------------------------------------------------------------

  /**
   * Record a new action that can be undone.
   */
  record(action: Omit<HistoryAction, "id" | "timestamp">): void {
    const state = this.getState();

    // Don't record while undoing/redoing
    if (state.isUndoingOrRedoing) {
      return;
    }

    // If batching, collect the action
    if (this.isBatching) {
      this.batchActions.push(action);
      return;
    }

    const fullAction: HistoryAction = {
      ...action,
      id: `action_${++this.actionIdCounter}`,
      timestamp: Date.now(),
    };

    // Add to undo stack
    let newUndoStack = [...state.undoStack, fullAction];

    // Trim to max size
    if (newUndoStack.length > this.options.maxHistorySize) {
      newUndoStack = newUndoStack.slice(-this.options.maxHistorySize);
    }

    this.store.set({
      ...state,
      undoStack: newUndoStack,
      // Clear redo stack when new action is recorded
      redoStack: [],
    });
  }

  // ---------------------------------------------------------------------------
  // Undo/Redo Operations
  // ---------------------------------------------------------------------------

  /**
   * Undo the last action.
   * @returns true if an action was undone, false if nothing to undo
   */
  undo(): boolean {
    const state = this.getState();

    if (state.undoStack.length === 0) {
      return false;
    }

    const action = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);

    // Set flag to prevent recording during undo
    this.store.set({
      ...state,
      isUndoingOrRedoing: true,
    });

    try {
      // Execute undo
      action.undo();

      // Move action to redo stack
      this.store.set({
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, action],
        isUndoingOrRedoing: false,
      });

      return true;
    } catch (error) {
      console.error("Error during undo:", error);
      this.store.set({
        ...this.getState(),
        isUndoingOrRedoing: false,
      });
      return false;
    }
  }

  /**
   * Redo the last undone action.
   * @returns true if an action was redone, false if nothing to redo
   */
  redo(): boolean {
    const state = this.getState();

    if (state.redoStack.length === 0) {
      return false;
    }

    const action = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);

    // Set flag to prevent recording during redo
    this.store.set({
      ...state,
      isUndoingOrRedoing: true,
    });

    try {
      // Execute redo
      action.redo();

      // Move action back to undo stack
      this.store.set({
        undoStack: [...state.undoStack, action],
        redoStack: newRedoStack,
        isUndoingOrRedoing: false,
      });

      return true;
    } catch (error) {
      console.error("Error during redo:", error);
      this.store.set({
        ...this.getState(),
        isUndoingOrRedoing: false,
      });
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------

  /**
   * Check if there are actions to undo.
   */
  canUndo(): boolean {
    return this.getState().undoStack.length > 0;
  }

  /**
   * Check if there are actions to redo.
   */
  canRedo(): boolean {
    return this.getState().redoStack.length > 0;
  }

  /**
   * Get the number of actions that can be undone.
   */
  getUndoCount(): number {
    return this.getState().undoStack.length;
  }

  /**
   * Get the number of actions that can be redone.
   */
  getRedoCount(): number {
    return this.getState().redoStack.length;
  }

  /**
   * Get the last action that can be undone.
   */
  getLastUndoAction(): HistoryAction | undefined {
    const stack = this.getState().undoStack;
    return stack[stack.length - 1];
  }

  /**
   * Get the last action that can be redone.
   */
  getLastRedoAction(): HistoryAction | undefined {
    const stack = this.getState().redoStack;
    return stack[stack.length - 1];
  }

  /**
   * Check if currently undoing/redoing.
   */
  isUndoingOrRedoing(): boolean {
    return this.getState().isUndoingOrRedoing;
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Execute a function without recording it in history.
   */
  withoutRecording<T>(fn: () => T): T {
    const state = this.getState();
    const wasUndoing = state.isUndoingOrRedoing;

    this.store.set({
      ...state,
      isUndoingOrRedoing: true,
    });

    try {
      return fn();
    } finally {
      this.store.set({
        ...this.getState(),
        isUndoingOrRedoing: wasUndoing,
      });
    }
  }

  /**
   * Create a batch of operations that will be recorded as a single undo action.
   */
  batch(description: string, fn: () => void): void {
    this.startBatch(description);
    try {
      fn();
    } finally {
      this.endBatch();
    }
  }

  startBatch(description: string): void {
    this.isBatching = true;
    this.batchDescription = description;
    this.batchActions = [];
  }

  endBatch(): void {
    if (!this.isBatching) {
      return;
    }

    const actions = [...this.batchActions];
    this.isBatching = false;
    this.batchActions = [];

    if (actions.length > 0) {
      this.record({
        type: "batch",
        description: this.batchDescription,
        undo: () => {
          for (let i = actions.length - 1; i >= 0; i--) {
            actions[i].undo();
          }
        },
        redo: () => {
          for (const action of actions) {
            action.redo();
          }
        },
      });
    }
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.store.set(createInitialState());
  }

  /**
   * Destroys the module.
   */
  destroy(): void {
    this.clear();
  }
}
