# @ptl/modular-core

A modular architecture library for building composable applications with a core store and pluggable modules.

## Overview

`@ptl/modular-core` provides a foundation for building modular applications. It offers:

- **Core**: A central class managing state via a Store and a module registry
- **Module**: An interface for creating pluggable modules that extend functionality
- **Helpers**: Utility functions for reducing boilerplate when creating modules

## Installation

```bash
bun add @ptl/modular-core
```

## Basic Usage

### 1. Define Your State

```typescript
interface AppState {
  count: number;
  name: string;
}
```

### 2. Create a Core Instance

```typescript
import { Core } from "@ptl/modular-core";

const core = new Core<AppState>({
  initialState: {
    count: 0,
    name: "App",
  },
});

// Access state
const count = core.select((s) => s.count);

// Subscribe to changes
core.subscribe((state) => {
  console.log("State changed:", state);
});
```

### 3. Create a Module

```typescript
import { Store, type Module } from "@ptl/modular-core";

interface CounterState {
  value: number;
}

interface CounterApi {
  getStore(): Store<CounterState>;
  increment(): void;
  decrement(): void;
  getValue(): number;
}

class CounterModule implements Module<CounterApi> {
  static id = "CounterModule";

  private store: Store<CounterState>;
  private core?: Core<AppState>;

  constructor(initialValue = 0) {
    this.store = new Store<CounterState>({ value: initialValue });
  }

  // Static helper to get the module from a core
  static for(core: Core<AppState>): CounterModule {
    return core.getModule(this);
  }

  attach(core: Core<AppState>): void {
    this.core = core;
  }

  detach(): void {
    this.core = undefined;
  }

  getStore(): Store<CounterState> {
    return this.store;
  }

  increment(): void {
    this.store.update((s) => {
      s.value++;
    });
  }

  decrement(): void {
    this.store.update((s) => {
      s.value--;
    });
  }

  getValue(): number {
    return this.store.select((s) => s.value);
  }
}
```

### 4. Register Modules

```typescript
// Option 1: Register during construction
const core = new Core<AppState>({
  initialState: { count: 0, name: "App" },
  modules: [new CounterModule(10)],
});

// Option 2: Register later
core.registerModule(new CounterModule(10));
```

### 5. Use Modules

```typescript
// Get the module using the static `for` helper
const counter = CounterModule.for(core);
counter.increment();
console.log(counter.getValue()); // 11

// Or using getModule
const counter2 = core.getModule(CounterModule);
counter2.decrement();
```

## Using createModuleBase Helper

For less boilerplate, use the `createModuleBase` helper:

```typescript
import { createModuleBase, type CoreApi } from "@ptl/modular-core";

// Define your core API type
type MyCore = CoreApi<AppState>;

// Create a base module class
const AppModule = createModuleBase<MyCore>();

// Extend it
class CounterModule extends AppModule {
  static id = "CounterModule";

  private core?: MyCore;

  attach(core: MyCore): void {
    this.core = core;
    // Setup module
  }

  detach(): void {
    this.core = undefined;
    // Cleanup
  }

  // Module-specific methods...
}

// The `for` method is automatically available
const counter = CounterModule.for(core);
```

## Extending Core

You can extend the `Core` class for domain-specific functionality:

```typescript
import { Core, type CoreOptions } from "@ptl/modular-core";

interface TimelineState {
  currentPosition: number;
  duration: number;
}

interface TimelineOptions extends CoreOptions<TimelineState> {
  fps?: number;
}

class Timeline extends Core<TimelineState> {
  private fps: number;

  constructor(options: TimelineOptions) {
    super(options);
    this.fps = options.fps ?? 30;
  }

  setPosition(position: number): void {
    this.store.update((s) => {
      s.currentPosition = Math.max(0, Math.min(position, s.duration));
    });
  }

  getPosition(): number {
    return this.select((s) => s.currentPosition);
  }

  getFps(): number {
    return this.fps;
  }
}
```

## API Reference

### Core<TState>

| Method | Description |
|--------|-------------|
| `getStore()` | Returns the internal Store instance |
| `getState()` | Returns the current state |
| `select(selector)` | Selects a subset of state |
| `subscribe(listener)` | Subscribes to state changes |
| `registerModule(module)` | Registers a module |
| `unregisterModule(module)` | Unregisters a module |
| `getModule(ModuleClass)` | Gets a registered module by class |
| `hasModule(ModuleClass)` | Checks if a module is registered |
| `getModules()` | Returns all registered modules |
| `destroy()` | Destroys the core and detaches all modules |

### Module<TApi, TCoreApi>

| Property/Method | Description |
|-----------------|-------------|
| `attach(core)` | Called when the module is registered |
| `detach()` | Called when the module is unregistered or core is destroyed |

### ModuleClass<T>

| Property | Description |
|----------|-------------|
| `id` | Static unique identifier for the module type |

## License

MIT
